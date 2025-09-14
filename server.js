const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // Use a different port from frontend

// Middleware
app.use(cors());
app.use(express.json());

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
    const { name, email, phone, address, service, date, slot, notes } = req.body;

    // Validate required fields
    if (!name || !email || !address || !service || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      submittedAt: new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Service price mapping (you can adjust these)
    const servicePrices = {
      'windows': 'From $99',
      'home': 'From $119',
      'office': 'From $129',
      'deep': 'From $199',
      'carpet': 'From $89',
      'oven': 'From $79',
      'endoflease': 'From $249'
    };

    const serviceNames = {
      'windows': 'Window Cleaning',
      'home': 'Home Cleaning',
      'office': 'Office Cleaning',
      'deep': 'Deep Cleaning',
      'carpet': 'Carpet Cleaning',
      'oven': 'Oven Cleaning',
      'endoflease': 'End-of-Lease Cleaning'
    };

    const serviceName = serviceNames[service] || service;
    const servicePrice = servicePrices[service] || 'Price on quote';

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
          <p><strong>Time Slot:</strong> ${slot === 'morning' ? 'Morning (8am-12pm)' : 'Afternoon (12pm-5pm)'}</p>
          ${notes !== 'None' ? `<p><strong>Special Notes:</strong> ${notes}</p>` : ''}
        </div>
        
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Booking API server running on port ${PORT}`);
});