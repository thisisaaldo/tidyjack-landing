import { useState } from 'react'
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
            <a href="#services" className="hover:underline">Services</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#areas" className="hover:underline">Areas</a>
            <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors">
              Book Now
            </button>
          </nav>
          <div className="sm:hidden flex items-center gap-1">
            <button className="text-xs hover:underline px-1 py-1">Menu</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 reveal">
        {/* Marketing headline */}
        <section className="mb-8 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
              Skip the mop and bucket
            </h1>
            <p className="mt-3 text-black/70 text-lg md:text-xl">
              Book professional cleaners online in minutes — no quotes, no hassle.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-6 reveal-children">
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

        {/* Services */}
        <section id="services" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 reveal-children">
            <div className="card p-4">
              <div className="font-medium">Window Cleaning</div>
              <p className="text-sm text-black/70">Inside & outside, frames & sills.</p>
              <div className="text-sm mt-2">From $99</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Home Cleaning</div>
              <p className="text-sm text-black/70">General inside clean.</p>
              <div className="text-sm mt-2">From $119</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Office Cleaning</div>
              <p className="text-sm text-black/70">Workspaces, reception, amenities.</p>
              <div className="text-sm mt-2">From $129</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Deep Cleaning</div>
              <p className="text-sm text-black/70">Detailed top‑to‑bottom clean.</p>
              <div className="text-sm mt-2">From $199</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Carpet Cleaning</div>
              <p className="text-sm text-black/70">Refresh high‑traffic areas.</p>
              <div className="text-sm mt-2">From $89</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Oven Cleaning</div>
              <p className="text-sm text-black/70">Degrease & polish.</p>
              <div className="text-sm mt-2">From $79</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">End‑of‑Lease</div>
              <p className="text-sm text-black/70">Bond‑ready standard.</p>
              <div className="text-sm mt-2">From $249</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Eco‑Friendly</div>
              <p className="text-sm text-black/70">Green products on request.</p>
              <div className="text-sm mt-2">Add‑on</div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 reveal-children">
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-1">Windows</div>
              <div className="font-medium">Up to 20</div>
              <div className="text-sm text-black/80">$99–$149</div>
            </div>
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-1">Windows</div>
              <div className="font-medium">21–40</div>
              <div className="text-sm text-black/80">$149–$249</div>
            </div>
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-black/55 mb-1">Windows</div>
              <div className="font-medium">41–60</div>
              <div className="text-sm text-black/80">$249–$399</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Home Cleaning</div>
              <div className="text-sm text-black/80">From $119</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Office Cleaning</div>
              <div className="text-sm text-black/80">From $129</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Deep Cleaning</div>
              <div className="text-sm text-black/80">From $199</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Carpet Cleaning</div>
              <div className="text-sm text-black/80">From $89</div>
            </div>
            <div className="card p-4">
              <div className="font-medium">Oven Cleaning</div>
              <div className="text-sm text-black/80">From $79</div>
            </div>
          </div>
          <p className="text-xs text-black/60 mt-2">Final price confirmed after details. Deposits available.</p>
        </section>

        {/* Areas */}
        <section id="areas" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-3">Browse by Australian destination</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 reveal-children">
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
          <h2 className="font-display text-2xl font-semibold mb-4">FAQ</h2>
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
              <summary className="cursor-pointer font-medium">What's included in the clean?</summary>
              <p className="text-sm text-black/70 mt-2">
                Standard services cover general cleaning (dusting, vacuuming, wiping surfaces, and bathrooms).
                Extras like carpet, oven, or deep cleaning can be added during booking.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Are cleaners insured and police‑checked?</summary>
              <p className="text-sm text-black/70 mt-2">
                Absolutely. All TidyJack cleaners are vetted, insured, and police‑checked for your peace of mind.
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
            <h3 className="font-display text-xl sm:text-2xl font-semibold">TidyJack — Australia's cleaning network</h3>
            <p className="mt-2 text-black/70">Book trusted, insured, and police-checked cleaners in minutes.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-sm text-black/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>©2025 TidyJack</span>
            <a href="#" className="underline hover:no-underline">Terms</a>
            <a href="#" className="underline hover:no-underline">Privacy</a>
            <a href="#" className="underline hover:no-underline">Cookies</a>
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
            <a href="#" aria-label="Blog" className="px-3 py-1.5 rounded-lg border border-black/20 text-sm hover:bg-black/5">BLOG</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
