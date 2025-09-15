import { pgTable, serial, text, varchar, integer, decimal, date, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Customers table
export const customers = pgTable('customers', {
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

// Bookings table with proper payment tracking
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customers.id).notNull(),
  booking_id: varchar('booking_id', { length: 100 }).unique().notNull(),
  service_type: varchar('service_type', { length: 100 }).notNull(),
  service_name: text('service_name').notNull(),
  // Store prices in cents to avoid float precision issues
  total_amount_cents: integer('total_amount_cents').notNull(),
  booking_date: date('booking_date').notNull(),
  time_slot: varchar('time_slot', { length: 50 }).notNull(),
  notes: text('notes'),
  // Payment tracking fields
  payment_type: varchar('payment_type', { length: 20 }).notNull(), // 'deposit' or 'full'
  deposit_required: boolean('deposit_required').default(false),
  deposit_cents: integer('deposit_cents').default(0),
  amount_paid_cents: integer('amount_paid_cents').default(0),
  payment_status: varchar('payment_status', { length: 30 }).notNull().default('unpaid'), 
  // Valid statuses: 'unpaid', 'deposit_paid', 'paid_in_full', 'failed', 'refunded'
  job_status: varchar('job_status', { length: 30 }).notNull().default('pending'),
  // Valid statuses: 'pending', 'in_progress', 'completed', 'cancelled'
  stripe_payment_intent_id: varchar('stripe_payment_intent_id', { length: 100 }),
  completed_at: timestamp('completed_at'), // When job was marked as completed
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  customerIdx: index('idx_bookings_customer_id').on(table.customer_id),
  bookingIdIdx: index('idx_bookings_booking_id').on(table.booking_id),
  dateIdx: index('idx_bookings_date').on(table.booking_date),
  paymentStatusIdx: index('idx_bookings_payment_status').on(table.payment_status),
  jobStatusIdx: index('idx_bookings_job_status').on(table.job_status)
}));

// Photos table for before/after images
export const photos = pgTable('photos', {
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

// Types for TypeScript
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;