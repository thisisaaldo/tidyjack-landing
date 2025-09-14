const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = 3001; // Use a different port from frontend

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Warning: STRIPE_SECRET_KEY not found. Payment processing will not work.');
}
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Service pricing map (single source of truth)
const SERVICE_PRICES = {
  // Residential Homes (inside & out)
  'apartmentflat': 150,
  'small_home': 200,
  'large_home': 270,
  'twostory_3bed': 320,
  'twostory_4bed': 360,
  // Residential Homes (exterior only - 60% of full price)
  'apartmentflat_ext': 90,
  'small_home_ext': 120,
  'large_home_ext': 162,
  'twostory_3bed_ext': 192,
  'twostory_4bed_ext': 216,
  // Retail Storefronts
  'small_shopfront': 25,
  'shopfront_full': 35,
  'deepclean': 60
};

// Calculate deposit amount (30% of full price, minimum $30, but never exceed full price)
const calculateDepositAmount = (fullPrice) => {
  return Math.min(fullPrice, Math.max(Math.round(fullPrice * 0.3), 30));
};

// Import the email utility (we'll handle this differently for Node.js)
async function sendEmail(message) {
  const authToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!authToken) {
    throw new Error("No authentication token found. Please ensure you're running in Replit environment.");
  }

  const response = await fetch("https://connectors.replit.com/api/v2/mailer/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X_REPLIT_TOKEN": authToken,
    },
    body: JSON.stringify({
      to: message.to,
      cc: message.cc,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }

  return await response.json();
}

// Booking endpoint
app.post('/api/booking', async (req, res) => {
  try {
    const { name, email, phone, address, service, date, slot, notes, paymentIntentId, amountPaid, paymentType, fullAmount } = req.body;

    // Validate required fields
    if (!name || !email || !address || !service || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment if provided
    let paymentStatus = 'pending';
    let verifiedAmount = null;
    let verifiedPaymentId = null;
    
    if (paymentIntentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Verify payment status - allow processing for async payment methods like Afterpay
        if (paymentIntent.status === 'succeeded') {
          paymentStatus = 'paid';
          verifiedAmount = paymentIntent.amount / 100;
          verifiedPaymentId = paymentIntent.id;
        } else if (paymentIntent.status === 'processing') {
          // Afterpay and other async payment methods may be processing
          paymentStatus = 'processing';
          verifiedAmount = paymentIntent.amount / 100;
          verifiedPaymentId = paymentIntent.id;
        } else {
          return res.status(400).json({ error: 'Payment not completed' });
        }
        
        // Server-side price verification (security critical)
        const fullPrice = SERVICE_PRICES[service] || 200;
        const depositAmount = calculateDepositAmount(fullPrice);
        
        // Determine expected amount based on payment type
        let expectedAmount;
        if (paymentType === 'deposit') {
          expectedAmount = depositAmount * 100; // in cents
        } else if (paymentType === 'full') {
          expectedAmount = fullPrice * 100; // in cents
        } else {
          // Fallback: check if amount matches either deposit or full amount
          if (paymentIntent.amount === depositAmount * 100) {
            expectedAmount = depositAmount * 100;
          } else if (paymentIntent.amount === fullPrice * 100) {
            expectedAmount = fullPrice * 100;
          } else {
            expectedAmount = fullPrice * 100; // default to full amount
          }
        }
        
        // Verify amount matches expected price
        if (paymentIntent.amount !== expectedAmount) {
          console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${paymentIntent.amount}`);
          return res.status(400).json({ error: 'Payment amount verification failed' });
        }
        
        // Verify currency
        if (paymentIntent.currency !== 'aud') {
          return res.status(400).json({ error: 'Invalid payment currency' });
        }
        
        // Amount and payment ID already set above based on status
        
      } catch (paymentError) {
        console.error('Payment verification error:', paymentError);
        return res.status(400).json({ error: 'Payment verification failed' });
      }
    }

    // Create booking details
    const bookingDetails = {
      name,
      email,
      phone: phone || 'Not provided',
      address,
      service,
      date,
      slot,
      notes: notes || 'None',
      bookingId: `TJ${Date.now()}`,
      paymentIntentId: verifiedPaymentId,
      amountPaid: verifiedAmount,
      paymentType: paymentType || (verifiedAmount && verifiedAmount < (SERVICE_PRICES[service] || 200) ? 'deposit' : 'full'),
      fullAmount: SERVICE_PRICES[service] || 200,
      paymentStatus,
      submittedAt: new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Service price labels for display
    const servicePriceLabels = {
      // Residential Homes (inside & out)
      'apartmentflat': '$150',
      'small_home': '$200',
      'large_home': '$270',
      'twostory_3bed': '$320',
      'twostory_4bed': '$360',
      // Residential Homes (exterior only)
      'apartmentflat_ext': '$90',
      'small_home_ext': '$120',
      'large_home_ext': '$162',
      'twostory_3bed_ext': '$192',
      'twostory_4bed_ext': '$216',
      // Retail Storefronts
      'small_shopfront': 'From $25',
      'shopfront_full': 'From $35',
      'deepclean': 'From $60'
    };

    const serviceNames = {
      // Residential Homes (inside & out)
      'apartmentflat': 'Apartment/Flat Windows (Inside & Out)',
      'small_home': 'Small Single-Storey Home (2-3 bed)',
      'large_home': 'Large Single-Storey Home (4+ bed)',
      'twostory_3bed': 'Two-Storey Home (3 bed)',
      'twostory_4bed': 'Two-Storey Home (4+ bed)',
      // Residential Homes (exterior only)
      'apartmentflat_ext': 'Apartment/Flat Windows (Exterior Only)',
      'small_home_ext': 'Small Home Windows (Exterior Only)',
      'large_home_ext': 'Large Home Windows (Exterior Only)',
      'twostory_3bed_ext': 'Two-Storey Home Windows (Exterior Only)',
      'twostory_4bed_ext': 'Two-Storey Home Windows (Exterior Only)',
      // Retail Storefronts
      'small_shopfront': 'Small Shopfront (Outside Only)',
      'shopfront_full': 'Shopfront (Inside & Outside)',
      'deepclean': 'One-off Deep Clean'
    };

    const serviceName = serviceNames[service] || service;
    const servicePrice = servicePriceLabels[service] || `From $${SERVICE_PRICES[service] || 200}`;

    // Send confirmation email to customer
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: #2563eb; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">TidyJack</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Professional Cleaning Services</p>
          <p style="color: white; margin: 5px 0 0 0; font-size: 16px;">Booking Confirmation</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e5e5;">
          <h2 style="color: #333; margin-top: 0;">Dear ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for choosing TidyJack Professional Cleaning Services. We have received your booking request and will contact you within 24 hours to confirm the details.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Estimated Price:</strong> ${servicePrice}</p>
            <p><strong>Preferred Date:</strong> ${date}</p>
            <p><strong>Time Slot:</strong> ${
              slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
              slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
              slot === 'weekend_afternoon' ? 'Weekend Afternoon (12pm-5pm)' :
              slot
            }</p>
            <p><strong>Address:</strong> ${address}</p>
            ${notes !== 'None' ? `<p><strong>Special Notes:</strong> ${notes}</p>` : ''}
            ${paymentStatus === 'paid' ? `
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 10px; border-radius: 6px; margin-top: 10px;">
              <p style="margin: 0; color: #065f46;"><strong>✅ Payment Confirmed</strong></p>
              <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">
                ${bookingDetails.paymentType === 'deposit' ? 
                  `Deposit: $${verifiedAmount} AUD (Remaining: $${bookingDetails.fullAmount - verifiedAmount} AUD on completion)` :
                  `Full Payment: $${verifiedAmount} AUD`
                }
              </p>
            </div>
            ` : paymentStatus === 'processing' ? `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 6px; margin-top: 10px;">
              <p style="margin: 0; color: #92400e;"><strong>⏳ Payment Processing</strong></p>
              <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
                ${bookingDetails.paymentType === 'deposit' ? 
                  `Deposit: $${verifiedAmount} AUD - You'll receive confirmation once payment completes` :
                  `Full Payment: $${verifiedAmount} AUD - You'll receive confirmation once payment completes`
                }
              </p>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0c4a6e;">
              <strong>Next Steps:</strong><br>
              Our team will review your booking request and contact you within 24 hours to confirm availability and provide a detailed quote.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>TidyJack Professional Cleaning Services</strong><br>
              Email: hellotidyjack@gmail.com<br>
              Have questions? Please reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    const customerEmailText = `
Dear ${name},

Thank you for choosing TidyJack Professional Cleaning Services. We have received your booking request and will contact you within 24 hours to confirm the details.

BOOKING DETAILS:
- Booking ID: ${bookingDetails.bookingId}
- Service: ${serviceName}
- Estimated Price: ${servicePrice}
- Preferred Date: ${date}
- Time Slot: ${
  slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
  slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
  slot === 'weekend_afternoon' ? 'Weekend Afternoon (12pm-5pm)' :
  slot
}
- Address: ${address}
${notes !== 'None' ? `- Special Notes: ${notes}` : ''}
${paymentStatus === 'paid' ? `
✅ PAYMENT CONFIRMED
${bookingDetails.paymentType === 'deposit' ? 
  `- Deposit Paid: $${verifiedAmount} AUD
- Remaining Balance: $${bookingDetails.fullAmount - verifiedAmount} AUD (due on completion)` :
  `- Full Payment: $${verifiedAmount} AUD`
}
- Payment ID: ${verifiedPaymentId}` : paymentStatus === 'processing' ? `
⏳ PAYMENT PROCESSING
${bookingDetails.paymentType === 'deposit' ? 
  `- Deposit: $${verifiedAmount} AUD` :
  `- Full Payment: $${verifiedAmount} AUD`
}
- Payment ID: ${verifiedPaymentId}
- Status: Payment is being processed, you'll receive confirmation once complete` : ''}

NEXT STEPS:
Our team will review your booking request and contact you within 24 hours to confirm availability and provide a detailed quote.

TidyJack Professional Cleaning Services
Email: hellotidyjack@gmail.com
Have questions? Please reply to this email.
    `;

    // Send notification email to business owner
    const businessEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: #2563eb; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">New TidyJack Booking Received</h2>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5;">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
          <h3>Service Details</h3>
          <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Estimated Price:</strong> ${servicePrice}</p>
          <p><strong>Preferred Date:</strong> ${date}</p>
          <p><strong>Time Slot:</strong> ${
            slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
            slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
            slot === 'weekend_afternoon' ? 'Weekend Afternoon (12pm-5pm)' :
            slot
          }</p>
          ${notes !== 'None' ? `<p><strong>Special Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        ${paymentStatus === 'paid' ? `
        <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-top: 0;">💳 Payment Received</h3>
          <p><strong>Type:</strong> ${bookingDetails.paymentType === 'deposit' ? 'Deposit Payment' : 'Full Payment'}</p>
          <p><strong>Amount:</strong> $${verifiedAmount} AUD</p>
          ${bookingDetails.paymentType === 'deposit' ? 
            `<p><strong>Remaining:</strong> $${bookingDetails.fullAmount - verifiedAmount} AUD (due on completion)</p>` : ''
          }
          <p><strong>Payment ID:</strong> ${verifiedPaymentId}</p>
          <p><strong>Status:</strong> Confirmed</p>
        </div>
        ` : paymentStatus === 'processing' ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">⏳ Payment Processing</h3>
          <p><strong>Type:</strong> ${bookingDetails.paymentType === 'deposit' ? 'Deposit Payment' : 'Full Payment'}</p>
          <p><strong>Amount:</strong> $${verifiedAmount} AUD</p>
          ${bookingDetails.paymentType === 'deposit' ? 
            `<p><strong>Remaining:</strong> $${bookingDetails.fullAmount - verifiedAmount} AUD (due on completion)</p>` : ''
          }
          <p><strong>Payment ID:</strong> ${verifiedPaymentId}</p>
          <p><strong>Status:</strong> Being processed - confirmation pending</p>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px;">
          <strong>Submitted:</strong> ${bookingDetails.submittedAt}<br>
          Please contact the customer within 24 hours to confirm availability.
        </p>
      </div>
    `;

    const businessEmailText = `
NEW TIDYJACK BOOKING RECEIVED

CUSTOMER INFORMATION:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Address: ${address}

SERVICE DETAILS:
- Booking ID: ${bookingDetails.bookingId}
- Service: ${serviceName}
- Estimated Price: ${servicePrice}
- Preferred Date: ${date}
- Time Slot: ${
  slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
  slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
  slot === 'weekend_afternoon' ? 'Weekend Afternoon (12pm-5pm)' :
  slot
}
${notes !== 'None' ? `- Special Notes: ${notes}` : ''}
${paymentStatus === 'paid' ? `
💳 PAYMENT RECEIVED
- Type: ${bookingDetails.paymentType === 'deposit' ? 'Deposit Payment' : 'Full Payment'}
- Amount: $${verifiedAmount} AUD
${bookingDetails.paymentType === 'deposit' ? 
  `- Remaining: $${bookingDetails.fullAmount - verifiedAmount} AUD (due on completion)` : ''
}
- Payment ID: ${verifiedPaymentId}
- Status: Confirmed` : paymentStatus === 'processing' ? `
⏳ PAYMENT PROCESSING
- Type: ${bookingDetails.paymentType === 'deposit' ? 'Deposit Payment' : 'Full Payment'}
- Amount: $${verifiedAmount} AUD
${bookingDetails.paymentType === 'deposit' ? 
  `- Remaining: $${bookingDetails.fullAmount - verifiedAmount} AUD (due on completion)` : ''
}
- Payment ID: ${verifiedPaymentId}
- Status: Being processed - you'll receive updates once complete` : ''}

Submitted: ${bookingDetails.submittedAt}
Please contact the customer within 24 hours to confirm availability.
    `;

    // Send customer confirmation email
    await sendEmail({
      to: email,
      subject: `TidyJack Booking Confirmation - Reference ${bookingDetails.bookingId}`,
      html: customerEmailHtml,
      text: customerEmailText,
    });

    // Send business notification email  
    const businessEmail = process.env.BUSINESS_EMAIL || 'hellotidyjack@gmail.com';
    
    await sendEmail({
      to: businessEmail,
      subject: `New TidyJack Booking: ${serviceName} - ${name}`,
      html: businessEmailHtml,
      text: businessEmailText,
    });

    console.log(`✅ Booking ${bookingDetails.bookingId} processed successfully - emails sent to ${email} and ${businessEmail}`);

    res.json({ 
      success: true, 
      message: 'Booking received successfully!',
      bookingId: bookingDetails.bookingId
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Failed to process booking',
      details: error.message 
    });
  }
});

// Stripe payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Payments unavailable: Stripe not configured' });
    }

    const { bookingData } = req.body;
    const { paymentType } = req.body;

    // Server-side price calculation (NEVER trust client amounts)
    const service = bookingData?.service;
    if (!service || !SERVICE_PRICES[service]) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    const fullPrice = SERVICE_PRICES[service];
    const serverAmount = paymentType === 'deposit' ? calculateDepositAmount(fullPrice) : fullPrice;

    // Create payment intent with Afterpay support
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(serverAmount * 100), // Convert to cents
      currency: 'aud', // Australian dollars
      payment_method_types: ['card', 'afterpay_clearpay'], // Enable Afterpay
      metadata: {
        bookingType: bookingData?.service || 'cleaning_service',
        paymentType: paymentType || 'full',
        fullAmount: fullPrice.toString(),
        customerEmail: bookingData?.email || '',
        customerName: bookingData?.name || '',
        address: bookingData?.address || '',
        timeSlot: bookingData?.slot || '',
        date: bookingData?.date || ''
      },
      description: `TidyJack ${bookingData?.service || 'Cleaning'} Service`
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Booking API server running on port ${PORT}`);
});