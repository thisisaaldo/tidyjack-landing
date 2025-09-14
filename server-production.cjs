const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

// Import database storage classes (CommonJS)
const { CustomerStorage: CustomerStorageClass, BookingStorage: BookingStorageClass, PhotoStorage: PhotoStorageClass } = require('./server/storage.cjs');
const { ObjectStorageService, ObjectNotFoundError } = require('./server/objectStorage.cjs');

const app = express();
const PORT = 5000; // Single port for autoscale deployment

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
  
  // Remove requests outside the window
  rateLimitedRoutes[ip] = rateLimitedRoutes[ip].filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (rateLimitedRoutes[ip].length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  
  rateLimitedRoutes[ip].push(now);
  next();
}

console.log('Initializing storage services...');

// Global storage instances
let CustomerStorage, BookingStorage, PhotoStorage;

async function initializeServices() {
  try {
    // Initialize storage instances using the imported classes
    CustomerStorage = CustomerStorageClass;
    BookingStorage = BookingStorageClass;
    PhotoStorage = PhotoStorageClass;
    
    console.log('✅ Storage services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize storage services:', error);
    return false;
  }
}

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

// ALL API ROUTES (copied from server.cjs)
// ==========================================

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

// Photo management endpoints
app.get('/api/admin/photos/upload', requireAdmin, async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const { uploadURL, storagePath } = await objectStorageService.getPhotoUploadURL();
    res.json({ uploadURL, storagePath });
  } catch (error) {
    console.error('Photo upload URL error:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
});

// Direct photo upload endpoint
app.post('/api/admin/photos/direct-upload', requireAdmin, express.raw({ type: 'image/jpeg', limit: '10mb' }), async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads', 'tidyjacks-photos');
    
    // Ensure upload directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
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

app.post('/api/admin/photos', requireAdmin, async (req, res) => {
  try {
    const { bookingId, photoType, storagePath } = req.body;
    
    if (!bookingId || !photoType || !storagePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['before', 'after'].includes(photoType)) {
      return res.status(400).json({ error: 'Photo type must be "before" or "after"' });
    }

    // Find the booking by string ID to get the numeric ID
    let numericBookingId;
    if (typeof bookingId === 'string' && bookingId.startsWith('TJ')) {
      const booking = await BookingStorage.findByBookingId(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      numericBookingId = booking.id;
    } else {
      numericBookingId = parseInt(bookingId);
    }

    const objectStorageService = new ObjectStorageService();
    const fileUrl = objectStorageService.generatePhotoURL(storagePath);
    
    const photo = await PhotoStorage.create({
      booking_id: numericBookingId,
      photo_type: photoType,
      file_path: storagePath,
      file_url: fileUrl
    });

    // Check if both photos exist using numeric ID
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

app.get('/api/admin/photos/:bookingId', requireAdmin, async (req, res) => {
  try {
    let bookingId = req.params.bookingId;
    let numericBookingId;
    
    // Handle string booking IDs like "TJ1757832854212"
    if (typeof bookingId === 'string' && bookingId.startsWith('TJ')) {
      const booking = await BookingStorage.findByBookingId(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      numericBookingId = booking.id;
    } else {
      numericBookingId = parseInt(bookingId);
    }
    
    const photos = await PhotoStorage.getByBookingId(numericBookingId);
    res.json(photos);
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
    const filePath = req.url.startsWith('/') ? req.url : '/' + req.url;
    
    // Security: ensure path is within allowed directory
    const allowedPrefix = '/tidyjacks-photos/';
    if (!filePath.startsWith(allowedPrefix)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Convert URL path to actual file path
    const filename = path.basename(filePath);
    const fullPath = path.join(__dirname, 'uploads', 'tidyjacks-photos', filename);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Serve the file
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.sendFile(fullPath);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Photo not found' });
    }
    console.error('Photo serve error:', error);
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
            Here are the before and after photos showing the fantastic results:
          </p>

          <div style="margin: 30px 0;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="color: #333; margin-bottom: 15px;">📷 Before</h3>
              <img src="https://www.tidyjacks.com${beforePhoto.file_url}" alt="Before cleaning" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            </div>
            
            <div style="text-align: center;">
              <h3 style="color: #333; margin-bottom: 15px;">✨ After</h3>
              <img src="https://www.tidyjacks.com${afterPhoto.file_url}" alt="After cleaning" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            </div>
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
      text: `Hi ${customer.name}, your window cleaning service is complete! Visit https://www.tidyjacks.com to view your before and after photos.`
    });

    res.json({ success: true, message: 'Photos sent successfully' });
  } catch (error) {
    console.error('Send photos email error:', error);
    res.status(500).json({ error: 'Failed to send photos email' });
  }
});

// SERVE FRONTEND STATIC FILES
// ===========================
// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler for SPA routing - serve index.html for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the combined server
async function startServer() {
  const initialized = await initializeServices();
  if (!initialized) {
    console.error('Failed to initialize services. Server will not start.');
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`📡 API endpoints available at /api/*`);
    console.log(`🌐 Frontend served from /dist`);
    console.log(`📱 Admin dashboard at /admin`);
  });
}

startServer();