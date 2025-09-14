import React from 'react'
import BookingForm from './components/BookingForm'
import HeroDog from './components/HeroDog'

function App() {
  return (
    <div className="font-sans min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <a
            href="#top"
            className="text-lg font-semibold tracking-tight hover:opacity-80 focus:opacity-80 rounded-md outline-none focus:outline-none cursor-pointer flex items-center"
            aria-label="Go to home"
          >
            🐾 TidyJack
          </a>
          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <button 
              onClick={() => {
                document.getElementById('book')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out animate-pulse hover:animate-none relative overflow-hidden group"
            >
              <span className="relative z-10 font-semibold">Book Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </nav>
          <div className="sm:hidden flex items-center gap-1">
            <button 
              onClick={() => {
                document.getElementById('book')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Book Now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 reveal">
        {/* Marketing headline */}
        <section className="mb-8 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <span 
                className="inline-block overflow-hidden whitespace-nowrap border-r-2 sm:border-r-4 border-blue-600 animate-pulse"
                style={{
                  animation: 'typewriter 3s steps(20, end) infinite, blink 1s step-end infinite'
                }}
              >
                Crystal clear windows
              </span>
            </h1>
            
            <style>{`
              @keyframes typewriter {
                0% { width: 0; }
                50% { width: 100%; }
                100% { width: 100%; }
              }
              
              @keyframes blink {
                0%, 50% { border-color: transparent; }
                51%, 100% { border-color: #2563eb; }
              }
            `}</style>
            <p className="mt-3 text-black/70 text-lg md:text-xl">
              Book professional window cleaning online in minutes — no quotes, no hassle.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-6 reveal-children">
          {/* Booking form */}
          <div className="grid gap-4 h-full" id="book">
            <div className="h-full glass shadow-md reveal card p-6">
              <h2 className="text-xl font-semibold mb-4">Quick booking</h2>
              <BookingForm />
            </div>
          </div>
          {/* Hero visual */}
          <div className="grid gap-4 h-full">
            <div className="reveal" style={{"--reveal-delay":"180ms"} as React.CSSProperties}>
              <HeroDog />
            </div>
          </div>
        </section>


        {/* Pricing */}
        <section id="pricing" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Window Cleaning Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 reveal-children">
            <div className="card p-6">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-2">Small Residential</div>
              <div className="font-semibold text-lg">Apartment/Small Home</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">$150-$200</div>
              <p className="text-sm text-black/70 mt-2">Inside & outside cleaning, frames & sills included</p>
            </div>
            <div className="card p-6">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-2">Large Residential</div>
              <div className="font-semibold text-lg">Large/Two-Storey Homes</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">$270-$360</div>
              <p className="text-sm text-black/70 mt-2">Complete home window cleaning service</p>
            </div>
            <div className="card p-6">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-2">Commercial</div>
              <div className="font-semibold text-lg">Retail Storefronts</div>
              <div className="text-2xl font-bold text-blue-600 mt-2">From $25</div>
              <p className="text-sm text-black/70 mt-2">Small shopfronts, full service & deep cleaning available</p>
            </div>
          </div>
          <p className="text-sm text-black/60 mt-4 text-center">Exterior-only options available at 60% of full pricing. Select your property type in the booking form for exact pricing.</p>
        </section>

        {/* Areas */}
        <section id="areas" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Australian Locations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 reveal-children">
            {[
              { city: 'Sydney', cityAbbr: 'SYD', stateAbbr: 'NSW', state: 'New South Wales' },
              { city: 'Melbourne', cityAbbr: 'MEL', stateAbbr: 'VIC', state: 'Victoria' },
              { city: 'Brisbane', cityAbbr: 'BNE', stateAbbr: 'QLD', state: 'Queensland' },
              { city: 'Perth', cityAbbr: 'PER', stateAbbr: 'WA', state: 'Western Australia' },
              { city: 'Adelaide', cityAbbr: 'ADL', stateAbbr: 'SA', state: 'South Australia' },
              { city: 'Canberra', cityAbbr: 'CBR', stateAbbr: 'ACT', state: 'Australian Capital Territory' },
            ].map(({ city, stateAbbr, state }) => (
              <div key={city} className="card p-4 flex flex-col items-center text-center hover:bg-black/[.03] transition-colors">
                <div className="w-24 h-24 rounded-full border border-black/20 flex items-center justify-center bg-white text-black mb-2">
                  <span className="font-semibold tracking-wide">{stateAbbr}</span>
                </div>
                <div className="font-medium">{city}</div>
                <div className="text-xs text-black/60">{state}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FAQ</h2>
          <div className="grid gap-3 reveal-children">
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">How does pricing work?</summary>
              <p className="text-sm text-black/70 mt-2">
                We provide instant estimates online. Final pricing may vary slightly depending on property size, condition,
                or special requests, but we'll always confirm before starting.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Do I need to pay a deposit?</summary>
              <p className="text-sm text-black/70 mt-2">
                Yes, a small deposit secures your booking. You can choose to pay the balance later or pay in full upfront.
                Deposits are refundable under our cancellation policy.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">What's included in window cleaning?</summary>
              <p className="text-sm text-black/70 mt-2">
                Complete window cleaning service includes inside and outside window cleaning, frames, sills, and screens.
                We use professional-grade equipment and eco-friendly cleaning solutions for streak-free results.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Are window cleaners insured and police‑checked?</summary>
              <p className="text-sm text-black/70 mt-2">
                Absolutely. All TidyJack window cleaning professionals are vetted, insured, and police‑checked for your peace of mind.
              </p>
            </details>
          </div>
        </section>

        {/* Compliance banner */}
        <section className="py-8">
          <div className="rounded-2xl border border-black/10 bg-black/[.03] p-4 sm:p-6 text-sm text-black/80">
            <ul className="space-y-1">
              <li><span className="font-medium">ABN:</span> Proudly registered in Australia (ABN 12 345 678 910)</li>
              <li><span className="font-medium">Insurance:</span> All TidyJack cleaners are fully insured</li>
              <li><span className="font-medium">Police checks:</span> Every cleaner is vetted and background checked</li>
              <li><span className="font-medium">Workplace safety:</span> Following Australian WHS standards</li>
              <li><span className="font-medium">Secure payments:</span> Powered by Stripe & Afterpay</li>
            </ul>
          </div>
        </section>

        {/* CTA footer */}
        <section className="py-10 border-t border-black/10">
          <div className="text-center">
            <h3 className="font-display text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TidyJack — Australia's window cleaning experts</h3>
            <p className="mt-2 text-black/70">Book trusted, insured, and police-checked window cleaners in minutes.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-sm text-black/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>©2025 TidyJack</span>
            <a href="#" className="underline hover:no-underline">Terms</a>
            <a href="#" className="underline hover:no-underline">Privacy</a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="#" aria-label="Facebook" className="group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-black/80 group-hover:text-black">
                <circle cx="12" cy="12" r="10"/>
                <path d="M13 8h2V6h-2a3 3 0 0 0-3 3v2H8v2h2v5h2v-5h2l1-2h-3V9a1 1 0 0 1 1-1Z" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-black/80 group-hover:text-black">
                <rect x="4" y="4" width="16" height="16" rx="4"/>
                <circle cx="12" cy="12" r="3.5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-black/80 group-hover:text-black">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75,15.02 15.5,11.75 9.75,8.48"/>
              </svg>
            </a>
            <a href="#" aria-label="TikTok" className="group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-black/80 group-hover:text-black">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="#" aria-label="Blog" className="px-3 py-1.5 rounded-lg border border-black/20 text-sm hover:bg-black/5">BLOG</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
