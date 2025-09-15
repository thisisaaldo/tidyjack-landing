import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { customers, bookings, type Customer, type NewCustomer, type Booking, type NewBooking } from '../shared/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool);

// Customer operations
export class CustomerStorage {
  static async create(customerData: NewCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  static async findByEmail(email: string): Promise<Customer | null> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || null;
  }

  static async getAll(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.created_at));
  }

  static async findById(id: number): Promise<Customer | null> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || null;
  }
}

// Booking operations
export class BookingStorage {
  static async create(bookingData: NewBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  static async findByBookingId(bookingId: string): Promise<Booking | null> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.booking_id, bookingId));
    return booking || null;
  }

  static async getAll(): Promise<Booking[]> {
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

  static async updatePaymentStatus(bookingId: string, paymentStatus: string, amountPaidCents: number, stripePaymentIntentId?: string) {
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

  static async getBookingsByPaymentStatus(status: string) {
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

  // Get bookings with remaining balance
  static async getBookingsWithBalance() {
    return db
      .select({
        booking: bookings,
        customer: customers,
        remaining_balance: sql<number>`${bookings.total_amount_cents} - ${bookings.amount_paid_cents}`.as('remaining_balance')
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customer_id, customers.id))
      .where(sql`${bookings.total_amount_cents} > ${bookings.amount_paid_cents}`)
      .orderBy(desc(bookings.created_at));
  }

  // Update job status
  static async updateJobStatus(bookingId: number, updateData: any) {
    return db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();
  }

  // Get completed jobs
  static async getCompletedJobs() {
    return db
      .select({
        booking: bookings,
        customer: customers
      })
      .from(bookings)
      .leftJoin(customers, eq(bookings.customer_id, customers.id))
      .where(eq(bookings.job_status, 'completed'))
      .orderBy(desc(bookings.completed_at));
  }
}