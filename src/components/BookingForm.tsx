import { useState } from 'react'
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete'

export default function BookingForm() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const [step, setStep] = useState<'quote' | 'booking'>('quote')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    service: 'residential_single',
    date: '',
    slot: 'weekday_afternoon',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [bookingId, setBookingId] = useState('')

  // Service options with instant pricing
  const serviceOptions = [
    { value: 'residential_single', label: 'Residential - Single Storey', price: 150, priceRange: '$150 - $600+', description: 'Standard maintenance clean' },
    { value: 'residential_double', label: 'Residential - Double Storey', price: 200, priceRange: '$200 - $700+', description: 'Two-storey homes' },
    { value: 'apartment_complex', label: 'Low-rise Apartment Complex', price: 300, priceRange: '$300 - $1,000+', description: 'Owners Corp buildings' },
    { value: 'commercial', label: 'Commercial Window Cleaning', price: 150, priceRange: '$150 - $500+', description: 'Business premises' }
  ]

  const selectedService = serviceOptions.find(s => s.value === formData.service) || serviceOptions[1]


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name || !formData.email || !formData.address || !formData.date) {
      setSubmitStatus('error')
      setSubmitMessage('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      const response = await fetch(`${apiUrl}/api/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          fullAmount: selectedService.price
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage('🎉 Booking confirmed! We\'ll contact you within 24 hours to arrange payment and confirm details.')
        setBookingId(result.bookingId)
        
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
        setStep('quote')
      } else {
        throw new Error(result.error || 'Failed to submit booking')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again or contact us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }


  // Quote Step - Simple service selection with instant pricing
  if (step === 'quote') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Instant Quote</h2>
          <p className="text-gray-600">Select your service and see the price immediately</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of cleaning do you need?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviceOptions.map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => setFormData({...formData, service: service.value})}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.service === service.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium text-gray-900">{service.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                  <div className="text-lg font-bold text-blue-600 mt-2">{service.priceRange}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Instant Quote Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 mb-1">Price Range</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{selectedService.priceRange}</div>
            <div className="text-gray-700">{selectedService.label}</div>
            <div className="text-sm text-gray-600 mt-1">{selectedService.description}</div>
          </div>

          <button
            type="button"
            onClick={() => setStep('booking')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 font-semibold"
          >
            Get Quote & Book
          </button>

          {/* Pricing Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-gray-700">
            <p className="font-medium text-yellow-800 mb-2">* Pricing Disclaimer</p>
            <p className="leading-relaxed">
              Price estimates are for a standard maintenance clean only and do not include costs for special conditions like post build cleaning, paint/sticky tape removal, calcium build up or any 'initial clean' procedures that may be required. Flyscreens are usually included in the standard residential quote, however, if there is an abundance, large sized, hard access, or very dirty flyscreens, extra charges apply. Our standard inclusion is for a wet wipe down; if a full screen wash is required this would be an extra $10 per flyscreen. Any glass louvres, colonial/french windows, leadlight/stained glass will incur extra charges (usually 30%+). Skylights, balustrades, roof windows, highlight windows, etc. have not been considered in the quick estimate, and will be quoted on visual inspection through Google Maps, photos, or a site visit.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Booking Step - Customer details and booking
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <button
          type="button"
          onClick={() => setStep('quote')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
        >
          ← Back to Quote
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Booking</h2>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="text-lg font-semibold text-blue-800">{selectedService.label}</div>
          <div className="text-xl font-bold text-blue-600">{selectedService.priceRange}</div>
          <div className="text-sm text-gray-600 mt-1">{selectedService.description}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
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
            Phone Number
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
            Service Address *
          </label>
          {googleMapsApiKey ? (
            <GooglePlacesAutocomplete
              value={formData.address}
              onChange={(value) => setFormData({...formData, address: value})}
              onPlaceSelect={(place) => {
                console.log('Selected place:', place)
              }}
              placeholder="Enter your address"
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
              placeholder="Enter your address"
              required
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="slot" className="block text-sm font-medium text-gray-700 mb-1">
              Time Preference
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
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Special Instructions (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special requests or access instructions..."
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
                <h3 className="text-sm font-medium text-green-800">Booking Confirmed! 🎉</h3>
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
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Confirming Booking...
            </span>
          ) : (
            `Confirm Booking Request`
          )}
        </button>
      </form>
    </div>
  </div>
  )
}
