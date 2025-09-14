import { useState } from 'react'
import PaymentForm from './PaymentForm'

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service: 'windows',
    date: '',
    slot: 'weekday_afternoon',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)

  // Calculate pricing based on service
  const getServicePrice = (service: string) => {
    const prices: { [key: string]: number } = {
      'windows': 99,
      'home': 119,
      'office': 129,
      'deep': 199,
      'carpet': 89,
      'oven': 79,
      'endoflease': 249
    }
    return prices[service] || 119
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form and proceed to payment
    if (!formData.name || !formData.email || !formData.address || !formData.date) {
      setSubmitStatus('error')
      setSubmitMessage('Please fill in all required fields.')
      return
    }

    const amount = getServicePrice(formData.service)
    setPaymentAmount(amount)
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          paymentIntentId,
          amountPaid: paymentAmount
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage('Booking confirmed and payment processed! Check your email for confirmation.')
        setBookingId(result.bookingId)
        setShowPayment(false)
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          service: 'windows',
          date: '',
          slot: 'weekday_afternoon',
          notes: ''
        })
      } else {
        throw new Error(result.error || 'Failed to confirm booking')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : 'Something went wrong after payment. Please contact us.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentError = (error: string) => {
    setSubmitStatus('error')
    setSubmitMessage(`Payment failed: ${error}`)
    setIsSubmitting(false)
  }

  const handleBackToForm = () => {
    setShowPayment(false)
    setSubmitStatus('idle')
    setSubmitMessage('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Show payment form if user proceeds to payment
  if (showPayment) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Service:</strong> Window Cleaning</p>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Time:</strong> {
              formData.slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
              formData.slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
              'Weekend Afternoon (12pm-5pm)'
            }</p>
            <p><strong>Address:</strong> {formData.address}</p>
            <p><strong>Total:</strong> <span className="font-bold text-lg">${paymentAmount} AUD</span></p>
          </div>
        </div>
        
        <PaymentForm
          amount={paymentAmount}
          bookingData={formData}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
        
        <button
          type="button"
          onClick={handleBackToForm}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Booking Details
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0400 000 000"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="123 Main St, Sydney NSW 2000"
          required
        />
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="slot" className="block text-sm font-medium text-gray-700 mb-1">
            Time Slot
          </label>
          <select
            id="slot"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekday_afternoon">Weekday Afternoon (3pm-6pm)</option>
            <option value="weekend_morning">Weekend Morning (8am-12pm)</option>
            <option value="weekend_afternoon">Weekend Afternoon (12pm-5pm)</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            📅 Available weekdays after 3pm, all day weekends
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Special Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any special requests or instructions..."
        />
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Booking Confirmed!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{submitMessage}</p>
                {bookingId && <p className="font-medium mt-1">Booking ID: {bookingId}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Booking Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out animate-pulse hover:animate-none relative overflow-hidden group font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:animate-none"
      >
        <span className="relative z-10">
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            `Continue to Payment - $${getServicePrice(formData.service)} AUD`
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
    </form>
  )
}
