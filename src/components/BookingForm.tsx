import { useState, useEffect } from 'react'
import PaymentForm from './PaymentForm'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'

export default function BookingForm() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!googleMapsApiKey) {
    console.warn('Google Maps API key not found. Address autocomplete will not work.')
  }
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service: 'small_home',
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
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit')

  // Calculate pricing based on service
  const getServicePrice = (service: string) => {
    const prices: { [key: string]: number } = {
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
    }
    return prices[service] || 200
  }

  // Get service display name
  const getServiceName = (service: string) => {
    const names: { [key: string]: string } = {
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
    }
    return names[service] || 'Window Cleaning Service'
  }

  // Calculate deposit amount (30% of full price, minimum $30, but never exceed full price)
  const getDepositAmount = (fullPrice: number) => {
    return Math.min(fullPrice, Math.max(Math.round(fullPrice * 0.3), 30))
  }

  // Check if deposit option should be available (only if deposit would be meaningfully less than full price)
  const shouldShowDepositOption = (fullPrice: number) => {
    const deposit = getDepositAmount(fullPrice)
    // Hide deposit option if deposit is more than 80% of full price
    return deposit < fullPrice * 0.8
  }

  // Get payment amount based on selected payment type
  const getPaymentAmount = () => {
    const fullPrice = getServicePrice(formData.service)
    return paymentType === 'deposit' ? getDepositAmount(fullPrice) : fullPrice
  }

  // Auto-switch to full payment if deposit option is not available for current service
  useEffect(() => {
    const currentServicePrice = getServicePrice(formData.service)
    if (!shouldShowDepositOption(currentServicePrice) && paymentType === 'deposit') {
      setPaymentType('full')
    }
  }, [formData.service, paymentType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form and proceed to payment
    if (!formData.name || !formData.email || !formData.address || !formData.date) {
      setSubmitStatus('error')
      setSubmitMessage('Please fill in all required fields.')
      return
    }

    const amount = getPaymentAmount()
    setPaymentAmount(amount)
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('https://1418cf15-1ec1-4817-a08e-7b0f3ecf5cb6-00-2dhmm2uavx57i.kirk.replit.dev:3001/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          paymentIntentId,
          amountPaid: paymentAmount,
          paymentType: paymentType,
          fullAmount: getServicePrice(formData.service)
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
          service: 'small_home',
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
            <p><strong>Service:</strong> {getServiceName(formData.service)}</p>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Time:</strong> {
              formData.slot === 'weekday_afternoon' ? 'Weekday Afternoon (3pm-6pm)' :
              formData.slot === 'weekend_morning' ? 'Weekend Morning (8am-12pm)' :
              'Weekend Afternoon (12pm-5pm)'
            }</p>
            <p><strong>Address:</strong> {formData.address}</p>
            <p><strong>Payment:</strong> <span className="font-bold text-lg">${paymentAmount} AUD</span> 
              {paymentType === 'deposit' ? ` (${Math.round((paymentAmount / getServicePrice(formData.service)) * 100)}% deposit)` : ' (full payment)'}
            </p>
            {paymentType === 'deposit' && (
              <p className="text-xs text-blue-600 mt-1">
                Remaining balance: ${getServicePrice(formData.service) - paymentAmount} AUD (paid on completion)
              </p>
            )}
          </div>
        </div>
        
        <PaymentForm
          amount={paymentAmount}
          bookingData={{...formData, paymentType: paymentType}}
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
        {googleMapsApiKey ? (
          <GooglePlacesAutocomplete
            value={formData.address}
            onChange={(value) => setFormData({...formData, address: value})}
            onPlaceSelect={(place) => {
              console.log('Selected place:', place)
            }}
            placeholder="e.g. 123 Collins Street, Melbourne VIC 3000, Australia"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            apiKey={googleMapsApiKey}
            required
          />
        ) : (
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. 123 Collins Street, Melbourne VIC 3000, Australia"
            required
          />
        )}
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
          Service Type
        </label>
        <select
          id="service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <optgroup label="🏠 Residential Homes (Inside & Out)">
            <option value="apartmentflat">Apartment/Flat - $150</option>
            <option value="small_home">Small Single-Storey (2-3 bed) - $200</option>
            <option value="large_home">Large Single-Storey (4+ bed) - $270</option>
            <option value="twostory_3bed">Two-Storey (3 bed) - $320</option>
            <option value="twostory_4bed">Two-Storey (4+ bed) - $360</option>
          </optgroup>
          <optgroup label="🏠 Residential Homes (Exterior Only)">
            <option value="apartmentflat_ext">Apartment/Flat Exterior - $90</option>
            <option value="small_home_ext">Small Home Exterior - $120</option>
            <option value="large_home_ext">Large Home Exterior - $162</option>
            <option value="twostory_3bed_ext">Two-Storey Exterior (3 bed) - $192</option>
            <option value="twostory_4bed_ext">Two-Storey Exterior (4+ bed) - $216</option>
          </optgroup>
          <optgroup label="🏪 Retail Storefronts">
            <option value="small_shopfront">Small Shopfront (Outside Only) - From $25</option>
            <option value="shopfront_full">Shopfront (Inside & Outside) - From $35</option>
            <option value="deepclean">One-off Deep Clean - From $60</option>
          </optgroup>
        </select>
        <p className="text-sm text-gray-600 mt-1">
          💡 Exterior-only services are 60% of full pricing. Retail pricing may vary based on size.
        </p>
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

      {/* Payment Option Selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Option
        </label>
        <div className="space-y-3">
          {shouldShowDepositOption(getServicePrice(formData.service)) ? (
            <div className="flex items-center">
              <input
                type="radio"
                id="deposit"
                name="paymentType"
                value="deposit"
                checked={paymentType === 'deposit'}
                onChange={(e) => setPaymentType(e.target.value as 'deposit' | 'full')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="deposit" className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Pay Deposit - ${getDepositAmount(getServicePrice(formData.service))} AUD
                </div>
                <div className="text-sm text-gray-600">
                  Secure your booking with {Math.round((getDepositAmount(getServicePrice(formData.service)) / getServicePrice(formData.service)) * 100)}% deposit. Pay remaining ${getServicePrice(formData.service) - getDepositAmount(getServicePrice(formData.service))} AUD on completion.
                </div>
              </label>
            </div>
          ) : null}
          <div className="flex items-center">
            <input
              type="radio"
              id="full"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={(e) => setPaymentType(e.target.value as 'deposit' | 'full')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="full" className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900">
                Pay Full Amount - ${getServicePrice(formData.service)} AUD
              </div>
              <div className="text-sm text-gray-600">
                Pay the complete amount now and you're all set!
              </div>
            </label>
          </div>
        </div>
        {!shouldShowDepositOption(getServicePrice(formData.service)) && (
          <p className="text-sm text-amber-600 mt-2">
            💡 Full payment only for this service due to low cost. Deposit option available for higher-value services.
          </p>
        )}
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
            `Continue to Payment - $${getPaymentAmount()} AUD ${paymentType === 'deposit' ? '(Deposit)' : '(Full)'}`
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
    </form>
  )
}
