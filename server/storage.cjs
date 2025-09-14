const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { pgTable, serial, text, varchar, integer, date, timestamp, boolean, index } = require('drizzle-orm/pg-core');
const { sql, eq, desc } = require('drizzle-orm');

// Database schema definitions (CommonJS compatible)
const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  emailIdx: index('idx_customers_email').on(table.email),
  phoneIdx: index('idx_customers_phone').on(table.phone)
}));

const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customers.id).notNull(),
  booking_id: varchar('booking_id', { length: 100 }).unique().notNull(),
  service_type: varchar('service_type', { length: 100 }).notNull(),
  service_name: text('service_name').notNull(),
  total_amount_cents: integer('total_amount_cents').notNull(),
  booking_date: date('booking_date').notNull(),
  time_slot: varchar('time_slot', { length: 50 }).notNull(),
  notes: text('notes'),
  payment_type: varchar('payment_type', { length: 20 }).notNull(),
  deposit_required: boolean('deposit_required').default(false),
  deposit_cents: integer('deposit_cents').default(0),
  amount_paid_cents: integer('amount_paid_cents').default(0),
  payment_status: varchar('payment_status', { length: 30 }).notNull().default('unpaid'),
  stripe_payment_intent_id: varchar('stripe_payment_intent_id', { length: 100 }),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  customerIdx: index('idx_bookings_customer_id').on(table.customer_id),
  bookingIdIdx: index('idx_bookings_booking_id').on(table.booking_id),
  dateIdx: index('idx_bookings_date').on(table.booking_date),
  paymentStatusIdx: index('idx_bookings_payment_status').on(table.payment_status)
}));

// Photos table for before/after images
const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').references(() => bookings.id).notNull(),
  photo_type: varchar('photo_type', { length: 20 }).notNull(), // 'before' or 'after'
  file_path: text('file_path').notNull(), // Object storage path
  file_url: text('file_url').notNull(), // Public URL to access the photo
  captured_at: timestamp('captured_at').default(sql`CURRENT_TIMESTAMP`),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  bookingIdx: index('idx_photos_booking_id').on(table.booking_id),
  typeIdx: index('idx_photos_type').on(table.photo_type)
}));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const db = drizzle(pool);

// Customer operations
class CustomerStorage {
  static async create(customerData) {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  static async findByEmail(email) {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || null;
  }

  static async getAll() {
    return db.select().from(customers).orderBy(desc(customers.created_at));
  }

  static async findById(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || null;
  }
}

// Booking operations
class BookingStorage {
  static async create(bookingData) {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  static async findByBookingId(bookingId) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.booking_id, bookingId));
    return booking || null;
  }

  static async getAll() {
    return db.select().from(bookings).orderBy(desc(bookings.created_at));
  }

  static async getAllWithCustomers() {
    return db
      .select({
        booking: bookings,
        customer: customers
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customer_id, customers.id))
      .orderBy(desc(bookings.created_at));
  }

  static async updatePaymentStatus(bookingId, paymentStatus, amountPaidCents, stripePaymentIntentId) {
    return db
      .update(bookings)
      .set({
        payment_status: paymentStatus,
        amount_paid_cents: amountPaidCents,
        stripe_payment_intent_id: stripePaymentIntentId,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(bookings.booking_id, bookingId))
      .returning();
  }

  static async getBookingsByPaymentStatus(status) {
    return db
      .select({
        booking: bookings,
        customer: customers
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customer_id, customers.id))
      .where(eq(bookings.payment_status, status))
      .orderBy(desc(bookings.created_at));
  }

  static async getBookingsWithBalance() {
    return db
      .select({
        booking: bookings,
        customer: customers,
        remaining_balance: sql`${bookings.total_amount_cents} - ${bookings.amount_paid_cents}`.as('remaining_balance')
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customer_id, customers.id))
      .where(sql`${bookings.total_amount_cents} > ${bookings.amount_paid_cents}`)
      .orderBy(desc(bookings.created_at));
  }
}

// Photo operations
class PhotoStorage {
  static async create(photoData) {
    const [photo] = await db.insert(photos).values(photoData).returning();
    return photo;
  }

  static async getByBookingId(bookingId) {
    return db.select().from(photos).where(eq(photos.booking_id, bookingId)).orderBy(desc(photos.created_at));
  }

  static async getByBookingIdAndType(bookingId, photoType) {
    const [photo] = await db
      .select()
      .from(photos)
      .where(sql`${photos.booking_id} = ${bookingId} AND ${photos.photo_type} = ${photoType}`);
    return photo || null;
  }

  static async deleteById(id) {
    return db.delete(photos).where(eq(photos.id, id)).returning();
  }

  static async getBookingPhotos(bookingId) {
    const allPhotos = await PhotoStorage.getByBookingId(bookingId);
    const beforePhoto = allPhotos.find(p => p.photo_type === 'before');
    const afterPhoto = allPhotos.find(p => p.photo_type === 'after');
    
    return {
      before: beforePhoto,
      after: afterPhoto,
      hasCompleteSet: !!(beforePhoto && afterPhoto)
    };
  }
}

module.exports = {
  CustomerStorage,
  BookingStorage,
  PhotoStorage,
  customers,
  bookings,
  photos,
  db
};