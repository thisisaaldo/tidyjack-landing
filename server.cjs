const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

// Import database storage (CommonJS)
const { CustomerStorage, BookingStorage, PhotoStorage } = require('./server/storage.cjs');
const { ObjectStorageService, ObjectNotFoundError } = require('./server/objectStorage.cjs');

const app = express();
const PORT = 3001; // Use a different port from frontend

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Warning: STRIPE_SECRET_KEY not found. Payment processing will not work.');
}
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Middleware - CORS security configuration
const allowedOrigins = [
  'http://localhost:5000',
  'https://1418cf15-1ec1-4817-a08e-7b0f3ecf5cb6-00-2dhmm2uavx57i.kirk.replit.dev',
  'https://www.tidyjacks.com',
  'https://tidyjacks.com',
  // Add your production domain here when deploying
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Stripe webhook endpoint needs raw body, so handle it before express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' })); // Limit request size

// Rate limiting for sensitive endpoints
const rateLimitedRoutes = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitedRoutes[ip]) {
    rateLimitedRoutes[ip] = [];
  }
  
  // Clean old requests
  rateLimitedRoutes[ip] = rateLimitedRoutes[ip].filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Check if rate limit exceeded
  if (rateLimitedRoutes[ip].length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.' 
    });
  }
  
  // Add current request
  rateLimitedRoutes[ip].push(now);
  next();
}

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

// Input validation and sanitization
function validateAndSanitizeInput(req, res, next) {
  const { name, email, phone, address, service, date, slot, notes } = req.body;
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Phone validation (optional but if provided should be valid)
  if (phone && phone.length > 0) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
  }
  
  // Length validation
  if (name && name.length > 100) {
    return res.status(400).json({ error: 'Name too long' });
  }
  if (address && address.length > 500) {
    return res.status(400).json({ error: 'Address too long' });
  }
  if (notes && notes.length > 1000) {
    return res.status(400).json({ error: 'Notes too long' });
  }
  
  // Service validation
  if (service && !SERVICE_PRICES[service]) {
    return res.status(400).json({ error: 'Invalid service type' });
  }
  
  // Date validation (basic)
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  
  // Sanitize HTML in text fields to prevent email injection
  req.body.name = name?.replace(/[<>]/g, '') || '';
  req.body.address = address?.replace(/[<>]/g, '') || '';
  req.body.notes = notes?.replace(/[<>]/g, '') || '';
  
  next();
}

// Booking endpoint
app.post('/api/booking', rateLimit, validateAndSanitizeInput, async (req, res) => {
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
          <h1 style="color: white; margin: 0; font-size: 28px;">TidyJacks</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Professional Cleaning Services</p>
          <p style="color: white; margin: 5px 0 0 0; font-size: 16px;">Booking Confirmation</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e5e5;">
          <h2 style="color: #333; margin-top: 0;">Dear ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for choosing TidyJacks Professional Cleaning Services. We have received your booking request and will contact you within 24 hours to confirm the details.
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
              <strong>TidyJacks Professional Cleaning Services</strong><br>
              <strong>📧 Contact Us Directly:</strong> <a href="mailto:hellotidyjack@gmail.com" style="color: #2563eb;">hellotidyjack@gmail.com</a><br>
              Have questions or need to discuss your booking? Email us directly and we'll respond quickly!
            </p>
          </div>
        </div>
      </div>
    `;

    const customerEmailText = `
Dear ${name},

Thank you for choosing TidyJacks Professional Cleaning Services. We have received your booking request and will contact you within 24 hours to confirm the details.

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

TidyJacks Professional Cleaning Services
📧 CONTACT US DIRECTLY: hellotidyjack@gmail.com
Have questions or need to discuss your booking? Email us directly and we'll respond quickly!
    `;

    // Send notification email to business owner
    const businessEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: #2563eb; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">New TidyJacks Booking Received</h2>
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
      subject: `TidyJacks Booking Confirmation - Reference ${bookingDetails.bookingId}`,
      html: customerEmailHtml,
      text: customerEmailText,
    });

    // Send business notification email  
    const businessEmail = process.env.BUSINESS_EMAIL || 'hellotidyjack@gmail.com';
    
    await sendEmail({
      to: businessEmail,
      subject: `New TidyJacks Booking: ${serviceName} - ${name}`,
      html: businessEmailHtml,
      text: businessEmailText,
    });

    // ========================================
    // CRITICAL: SAVE BOOKING TO DATABASE
    // ========================================
    try {
      // Create or find customer
      let customer = await CustomerStorage.findByEmail(email);
      if (!customer) {
        customer = await CustomerStorage.create({
          name,
          email,
          phone: phone || null,
          address
        });
      }

      // Map payment status to admin dashboard format
      let dbPaymentStatus = 'unpaid'; // Default
      if (paymentStatus === 'paid') {
        // Determine if full payment or just deposit based on amount
        const fullPrice = SERVICE_PRICES[service] || 200;
        const depositAmount = calculateDepositAmount(fullPrice);
        
        if (verifiedAmount >= fullPrice) {
          dbPaymentStatus = 'paid_in_full';
        } else if (verifiedAmount >= depositAmount) {
          dbPaymentStatus = 'deposit_paid';
        }
      } else if (paymentStatus === 'processing') {
        // For processing payments, determine status based on amount like we do for paid
        const fullPrice = SERVICE_PRICES[service] || 200;
        const depositAmount = calculateDepositAmount(fullPrice);
        
        if (verifiedAmount >= fullPrice) {
          dbPaymentStatus = 'paid_in_full'; // Full amount processing
        } else if (verifiedAmount >= depositAmount) {
          dbPaymentStatus = 'deposit_paid'; // Deposit amount processing
        } else {
          dbPaymentStatus = 'unpaid'; // Invalid amount
        }
      }

      // Calculate amounts in cents
      const totalAmountCents = (SERVICE_PRICES[service] || 200) * 100;
      const amountPaidCents = (verifiedAmount || 0) * 100;
      const isDepositPayment = paymentType === 'deposit';

      // Create booking record
      await BookingStorage.create({
        customer_id: customer.id,
        booking_id: bookingDetails.bookingId,
        service_type: service,
        service_name: serviceNames[service] || service,
        total_amount_cents: totalAmountCents,
        booking_date: date,
        time_slot: slot || 'Not specified',
        notes: notes || null,
        payment_type: paymentType || 'full',
        deposit_required: isDepositPayment,
        deposit_cents: isDepositPayment ? calculateDepositAmount(SERVICE_PRICES[service] || 200) * 100 : 0,
        amount_paid_cents: amountPaidCents,
        payment_status: dbPaymentStatus,
        stripe_payment_intent_id: verifiedPaymentId || null
      });

      console.log(`✅ Booking ${bookingDetails.bookingId} saved to database - Customer: ${customer.id}, Payment Status: ${dbPaymentStatus}`);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Don't fail the booking if database save fails, but log it
    }

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

// Stripe payment intent endpoint (with stricter rate limiting)
function strictRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitedRoutes[ip]) {
    rateLimitedRoutes[ip] = [];
  }
  
  // Clean old requests
  rateLimitedRoutes[ip] = rateLimitedRoutes[ip].filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Stricter limit for payment endpoints: 5 requests per minute
  if (rateLimitedRoutes[ip].length >= 5) {
    return res.status(429).json({ 
      error: 'Too many payment requests. Please try again later.' 
    });
  }
  
  rateLimitedRoutes[ip].push(now);
  next();
}

app.post('/api/create-payment-intent', strictRateLimit, async (req, res) => {
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
      description: `TidyJacks ${bookingData?.service || 'Cleaning'} Service`
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

// Stripe webhook endpoint for handling async payment events
app.post('/api/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const succeededPayment = event.data.object;
        console.log(`✅ Payment succeeded: ${succeededPayment.id}`);
        
        // Send final confirmation emails for async payments like Afterpay
        if (succeededPayment.metadata.customerEmail) {
          await sendPaymentConfirmationEmail(succeededPayment, 'succeeded');
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`❌ Payment failed: ${failedPayment.id}`);
        if (failedPayment.last_payment_error) {
          console.log(`❌ Failure reason: ${failedPayment.last_payment_error.code} - ${failedPayment.last_payment_error.message}`);
          console.log(`❌ Failure type: ${failedPayment.last_payment_error.type}`);
        }
        console.log(`❌ Payment status: ${failedPayment.status}`);
        
        // Optionally send failure notification
        if (failedPayment.metadata.customerEmail) {
          await sendPaymentConfirmationEmail(failedPayment, 'failed');
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Helper function to send payment confirmation emails via webhook
async function sendPaymentConfirmationEmail(paymentIntent, status) {
  try {
    const { metadata } = paymentIntent;
    const amount = paymentIntent.amount / 100; // Convert from cents
    
    if (status === 'succeeded') {
      // Send final confirmation to customer
      await sendEmail({
        to: metadata.customerEmail,
        subject: `Payment Confirmed - TidyJacks Booking ${metadata.bookingType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #10b981; padding: 20px; border-radius: 8px; text-align: center; color: white;">
              <h2>✅ Payment Confirmed!</h2>
            </div>
            <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px;">
              <p><strong>Your payment has been successfully processed.</strong></p>
              <p><strong>Amount:</strong> $${amount} AUD</p>
              <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
              <p><strong>Service:</strong> ${metadata.bookingType}</p>
              ${metadata.customerName ? `<p><strong>Customer:</strong> ${metadata.customerName}</p>` : ''}
              <p>Thank you for choosing TidyJacks Professional Cleaning Services!</p>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 15px; margin-top: 20px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  <strong>📧 Contact Us Directly:</strong> <a href="mailto:hellotidyjack@gmail.com" style="color: #2563eb;">hellotidyjack@gmail.com</a><br>
                  Have questions about your payment or service? Email us directly and we'll respond quickly!
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Payment Confirmed!

Your payment has been successfully processed.
Amount: $${amount} AUD
Payment ID: ${paymentIntent.id}
Service: ${metadata.bookingType}
${metadata.customerName ? `Customer: ${metadata.customerName}` : ''}

Thank you for choosing TidyJacks Professional Cleaning Services!

📧 CONTACT US DIRECTLY: hellotidyjack@gmail.com
Have questions about your payment or service? Email us directly and we'll respond quickly!
        `
      });

      // Send notification to business
      const businessEmail = process.env.BUSINESS_EMAIL || 'hellotidyjack@gmail.com';
      await sendEmail({
        to: businessEmail,
        subject: `Payment Confirmed - ${metadata.customerName || 'Customer'} - $${amount} AUD`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>💳 Payment Confirmed</h2>
            <p><strong>Amount:</strong> $${amount} AUD</p>
            <p><strong>Customer:</strong> ${metadata.customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${metadata.customerEmail}</p>
            <p><strong>Service:</strong> ${metadata.bookingType}</p>
            <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
            <p><strong>Status:</strong> Completed via webhook</p>
          </div>
        `
      });
    } else if (status === 'failed') {
      // Send failure notification to customer
      await sendEmail({
        to: metadata.customerEmail,
        subject: `Payment Issue - TidyJacks Booking ${metadata.bookingType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ef4444; padding: 20px; border-radius: 8px; text-align: center; color: white;">
              <h2>❌ Payment Issue</h2>
            </div>
            <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px;">
              <p>We encountered an issue processing your payment for TidyJacks cleaning services.</p>
              <p><strong>Amount:</strong> $${amount} AUD</p>
              <p><strong>Service:</strong> ${metadata.bookingType}</p>
              <p>Please contact us at hellotidyjack@gmail.com to resolve this issue.</p>
            </div>
          </div>
        `
      });
    }

    console.log(`✅ Payment ${status} email sent to ${metadata.customerEmail}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

// ===========================================
// ADMIN API ROUTES
// ===========================================

// Simple admin authentication middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is required');
    return res.status(500).json({ error: 'Admin authentication not configured' });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const token = authHeader.substring(7);
  if (token !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  
  next();
}

// Get admin dashboard overview stats
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    if (!BookingStorage || !CustomerStorage) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const totalCustomers = (await CustomerStorage.getAll()).length;
    const allBookings = await BookingStorage.getAll();
    const bookingsWithBalance = await BookingStorage.getBookingsWithBalance();
    
    // Calculate stats
    const totalBookings = allBookings.length;
    const pendingPayments = allBookings.filter(b => b.payment_status === 'unpaid' || b.payment_status === 'deposit_paid').length;
    const totalRevenue = allBookings
      .filter(b => b.payment_status === 'paid_in_full')
      .reduce((sum, b) => sum + b.amount_paid_cents, 0);
    const pendingRevenue = bookingsWithBalance
      .reduce((sum, item) => sum + item.remaining_balance, 0);

    res.json({
      totalCustomers,
      totalBookings,
      pendingPayments,
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      pendingRevenue: pendingRevenue / 100,
      recentBookings: allBookings.slice(0, 5) // Last 5 bookings
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get all bookings with customer details
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  try {
    if (!BookingStorage) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const bookingsWithCustomers = await BookingStorage.getAllWithCustomers();
    
    // Format response with calculated remaining balance
    const formattedBookings = bookingsWithCustomers.map(item => ({
      ...item.booking,
      customer: item.customer,
      remaining_balance_cents: item.booking.total_amount_cents - item.booking.amount_paid_cents,
      remaining_balance: (item.booking.total_amount_cents - item.booking.amount_paid_cents) / 100
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// Get bookings with remaining balance
app.get('/api/admin/bookings/balance', requireAdmin, async (req, res) => {
  try {
    if (!BookingStorage) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const bookingsWithBalance = await BookingStorage.getBookingsWithBalance();
    
    const formattedBookings = bookingsWithBalance.map(item => ({
      ...item.booking,
      customer: item.customer,
      remaining_balance_cents: item.remaining_balance,
      remaining_balance: item.remaining_balance / 100
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Admin balance bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings with balance' });
  }
});

// Get all customers
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    if (!CustomerStorage) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const customers = await CustomerStorage.getAll();
    res.json(customers);
  } catch (error) {
    console.error('Admin customers error:', error);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// Update payment status for a booking
app.put('/api/admin/payment/update', requireAdmin, rateLimit, async (req, res) => {
  try {
    const { bookingId, paymentStatus, amountPaidCents, stripePaymentIntentId } = req.body;

    if (!BookingStorage) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    if (!bookingId || !paymentStatus || amountPaidCents === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment status
    const validStatuses = ['unpaid', 'deposit_paid', 'paid_in_full', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const [updatedBooking] = await BookingStorage.updatePaymentStatus(
      bookingId, 
      paymentStatus, 
      amountPaidCents, 
      stripePaymentIntentId
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ 
      message: 'Payment status updated successfully', 
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Admin payment update error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// PHOTO API ROUTES
// ===========================================

// Get upload URL for photo
app.post('/api/admin/photos/upload', requireAdmin, async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const { uploadURL, storagePath, objectId } = await objectStorageService.getPhotoUploadURL();
    res.json({ uploadURL, storagePath, objectId });
  } catch (error) {
    console.error('Photo upload URL error:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
});

// Direct photo upload endpoint - handles the actual file upload
app.post('/api/admin/photos/direct-upload', requireAdmin, express.raw({ type: 'image/jpeg', limit: '10mb' }), async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if we have photo data
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'No photo data received' });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'tidyjacks-photos');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Use the raw buffer from the request
    const photoBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
    
    // Generate filename from timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${require('crypto').randomUUID()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save file
    await fs.writeFile(filepath, photoBuffer);
    
    res.json({ 
      success: true,
      storagePath: `/tidyjacks-photos/${filename}`,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Direct photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Save photo metadata after upload
app.post('/api/admin/photos', requireAdmin, async (req, res) => {
  try {
    const { bookingId, photoType, storagePath } = req.body;
    
    if (!bookingId || !photoType || !storagePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['before', 'after'].includes(photoType)) {
      return res.status(400).json({ error: 'Photo type must be "before" or "after"' });
    }

    // CRITICAL FIX: Find the booking by string ID to get the numeric ID
    let numericBookingId;
    if (typeof bookingId === 'string' && bookingId.startsWith('TJ')) {
      console.log(`Looking up booking by string ID: ${bookingId}`);
      const booking = await BookingStorage.findByBookingId(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      numericBookingId = booking.id;
      console.log(`Found booking, numeric ID: ${numericBookingId}`);
    } else {
      numericBookingId = parseInt(bookingId);
    }

    const objectStorageService = new ObjectStorageService();
    
    const photoData = {
      booking_id: numericBookingId,
      photo_type: photoType,
      file_path: storagePath, // Save the storage path
      file_url: objectStorageService.generatePhotoURL(storagePath)
    };

    const photo = await PhotoStorage.create(photoData);
    
    // Check if we now have both before and after photos using numeric ID
    const allPhotos = await PhotoStorage.getByBookingId(numericBookingId);
    const hasCompleteSet = allPhotos.length >= 2 && 
      allPhotos.some(p => p.photo_type === 'before') && 
      allPhotos.some(p => p.photo_type === 'after');
    
    res.json({ 
      photo,
      hasCompleteSet
    });
  } catch (error) {
    console.error('Photo save error:', error);
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

// Get photos for a booking
app.get('/api/admin/photos/booking/:bookingId', requireAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const photoSet = await PhotoStorage.getBookingPhotos(bookingId);
    res.json(photoSet);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// Serve photos (simplified local file serving)
app.use('/api/photos', async (req, res, next) => {
  // Only handle GET requests for photo serving
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // req.url contains the path after /api/photos mount point
    const filePath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    
    // Security: ensure path is within allowed directory
    if (!filePath.startsWith('tidyjacks-photos/')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Construct local file path
    const localFilePath = path.join(__dirname, 'uploads', filePath);
    
    // Check if file exists
    try {
      await fs.access(localFilePath);
    } catch {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Set proper headers and serve file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the file
    const fileBuffer = await fs.readFile(localFilePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Photo serve error:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

// Serve photos publicly (for emails) - no authentication required
app.use('/api/public/photos', async (req, res, next) => {
  // Only handle GET requests for photo serving
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // req.url contains the path after /api/public/photos mount point
    const filePath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    
    // Security: ensure path is within allowed directory
    if (!filePath.startsWith('tidyjacks-photos/')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Construct local file path
    const localFilePath = path.join(__dirname, 'uploads', filePath);
    
    // Check if file exists
    try {
      await fs.access(localFilePath);
    } catch {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Set proper headers and serve file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the file
    const fileBuffer = await fs.readFile(localFilePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Public photo serve error:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

// Send before/after photos to customer
app.post('/api/admin/photos/send-email', requireAdmin, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Get booking and photos - handle both string and numeric booking IDs
    let booking, numericBookingId;
    if (typeof bookingId === 'string' && bookingId.startsWith('TJ')) {
      booking = await BookingStorage.findByBookingId(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      numericBookingId = booking.id;
    } else {
      numericBookingId = parseInt(bookingId);
      const allBookings = await BookingStorage.getAll();
      booking = allBookings.find(b => b.id === numericBookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
    }

    const customer = await CustomerStorage.findById(booking.customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const photos = await PhotoStorage.getByBookingId(numericBookingId);
    const beforePhoto = photos.find(p => p.photo_type === 'before');
    const afterPhoto = photos.find(p => p.photo_type === 'after');

    if (!beforePhoto || !afterPhoto) {
      return res.status(400).json({ error: 'Both before and after photos are required' });
    }

    // Read photo files for email attachments
    const fs = require('fs').promises;
    const path = require('path');
    
    let beforePhotoData = null;
    let afterPhotoData = null;
    
    try {
      // Read before photo (file_path is like "/tidyjacks-photos/filename.jpg")
      const beforePath = path.join(__dirname, 'uploads', beforePhoto.file_path.substring(1)); // Remove leading slash
      const beforeBuffer = await fs.readFile(beforePath);
      beforePhotoData = {
        filename: `Before-Photo-${booking.booking_id}.jpg`,
        content: beforeBuffer.toString('base64'),
        contentType: 'image/jpeg',
        encoding: 'base64'
      };
      
      // Read after photo  
      const afterPath = path.join(__dirname, 'uploads', afterPhoto.file_path.substring(1)); // Remove leading slash
      const afterBuffer = await fs.readFile(afterPath);
      afterPhotoData = {
        filename: `After-Photo-${booking.booking_id}.jpg`,
        content: afterBuffer.toString('base64'),
        contentType: 'image/jpeg',
        encoding: 'base64'
      };
    } catch (fileError) {
      console.error('Error reading photo files for attachment:', fileError);
      return res.status(500).json({ error: 'Could not read photo files for email' });
    }

    // Send email using Replit Mail
    const { sendMail } = require('./server/replitmail.cjs');
    
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🐾 TidyJacks</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Professional Window Cleaning</p>
        </div>
        
        <div style="background: white; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Job Complete - Before & After Photos</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hi ${customer.name},<br><br>
            Great news! We've completed your window cleaning service for booking <strong>${booking.booking_id}</strong>. 
            Please see the attached before and after photos showing the fantastic results:
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <h3 style="color: #333; margin-top: 0;">📎 Attached Photos</h3>
            <p style="color: #666; margin: 0;">
              • Before-Photo-${booking.booking_id}.jpg<br>
              • After-Photo-${booking.booking_id}.jpg
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
              Click on the attachments to view or save your photos
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Service Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Service:</strong> ${booking.service_name}</li>
              <li><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</li>
              <li><strong>Time:</strong> ${booking.time_slot}</li>
            </ul>
          </div>

          <p style="color: #666; line-height: 1.6;">
            We hope you're delighted with the results! Your windows are now sparkling clean and ready to let in all that beautiful natural light.
          </p>

          <p style="color: #666; line-height: 1.6;">
            If you have any questions or would like to schedule another service, just reply to this email or visit our website.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.tidyjacks.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Book Another Service</a>
          </div>

          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Thank you for choosing TidyJacks! 🐾<br>
            <em>Making your windows sparkle, one pane at a time</em>
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: customer.email,
      subject: `✨ Job Complete - Before & After Photos (${booking.booking_id})`,
      html: emailHtml,
      text: `Hi ${customer.name}, your window cleaning service is complete! Please see the attached before and after photos showing the fantastic results.`,
      attachments: [beforePhotoData, afterPhotoData]
    });

    res.json({ success: true, message: 'Photos sent successfully' });
  } catch (error) {
    console.error('Send photos email error:', error);
    res.status(500).json({ error: 'Failed to send photos email' });
  }
});

// Email service for before/after photos
async function sendBeforeAfterEmail(customer, booking, photoSet) {
  try {
    const { sendReplit } = require('replitmail');
    
    // Get the domain for photo URLs
    const domain = process.env.REPLIT_DEV_DOMAIN || 'localhost:3001';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    
    const beforePhotoUrl = `${protocol}://${domain}${photoSet.before.file_url}`;
    const afterPhotoUrl = `${protocol}://${domain}${photoSet.after.file_url}`;

    const subject = `🧽✨ TidyJacks Cleaning Results - ${booking.service_name}`;
    
    const emailContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🐾 TidyJacks Cleaning Results</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your windows are sparkling clean!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${customer.name}! 👋</h2>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">
            We've just finished cleaning your windows and wanted to share the amazing transformation! 
            Check out these before and after photos:
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-bottom: 15px; text-align: center;">📸 Cleaning Results</h3>
            
            <div style="display: table; width: 100%; border-collapse: collapse;">
              <div style="display: table-row;">
                <div style="display: table-cell; width: 50%; padding: 10px; vertical-align: top;">
                  <h4 style="text-align: center; color: #666; margin-bottom: 10px;">Before 😔</h4>
                  <img src="${beforePhotoUrl}" alt="Before cleaning" style="width: 100%; max-width: 250px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: block; margin: 0 auto;" />
                </div>
                <div style="display: table-cell; width: 50%; padding: 10px; vertical-align: top;">
                  <h4 style="text-align: center; color: #666; margin-bottom: 10px;">After ✨</h4>
                  <img src="${afterPhotoUrl}" alt="After cleaning" style="width: 100%; max-width: 250px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: block; margin: 0 auto;" />
                </div>
              </div>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 10px; color: #333;">Service Details:</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Service:</strong> ${booking.service_name}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Booking ID:</strong> ${booking.booking_id}</p>
          </div>

          <p style="line-height: 1.6; margin: 25px 0;">
            We hope you're thrilled with the results! Your windows now have that crystal-clear shine 
            that makes your home look its absolute best. ✨
          </p>
          
          <div style="background: #e8f2ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h3 style="color: #2c5282; margin-bottom: 15px;">🌟 Thank you for choosing TidyJacks!</h3>
            <p style="color: #2c5282; margin: 5px 0;">Questions about your service? Reply to this email</p>
            <p style="color: #2c5282; margin: 5px 0;">Ready to book again? Visit <a href="https://www.tidyjacks.com" style="color: #667eea; text-decoration: none; font-weight: bold;">www.tidyjacks.com</a></p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #667eea;">The TidyJacks Team</strong> 🐾
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await sendReplit({
      to: customer.email,
      subject: subject,
      html: emailContent
    });

    console.log(`Before/after photos email sent to ${customer.email} for booking ${booking.booking_id}`);
    return true;
  } catch (error) {
    console.error('Error sending before/after email:', error);
    return false;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Booking API server running on port ${PORT}`);
});