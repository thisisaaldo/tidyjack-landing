import React, { useEffect } from 'react'
import BookingForm from './components/BookingForm'
import HeroDog from './components/HeroDog'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  // Handle scroll position restoration on browser refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const handleLoad = () => {
      const savedScrollY = sessionStorage.getItem('scrollPosition');
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY, 10));
        sessionStorage.removeItem('scrollPosition'); // Clean up after restoring
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []); // Run once on mount and cleanup on unmount
  // Check if current path is admin
  const isAdminPath = window.location.pathname === '/admin';
  
  if (isAdminPath) {
    return <AdminDashboard />;
  }

  return (
    <div className="font-sans min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <a
            href="/"
            className="text-lg font-semibold tracking-tight hover:opacity-80 focus:opacity-80 rounded-md outline-none focus:outline-none cursor-pointer flex items-center"
            aria-label="Go to home"
          >
            🐾 TidyJacks
          </a>
          <nav className="hidden sm:flex items-center gap-3 text-sm">
            <a 
              href="tel:0493105484"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              0493 105 484
            </a>
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
              Window Cleaning in Melbourne
            </h1>
            <p className="mt-3 text-black/70 text-lg md:text-xl">
              Book trusted, insured window cleaners online in seconds. No quotes, no hassle.
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

        {/* FAQ */}
        <section id="faq" className="py-10 border-t border-black/10 reveal">
          <h2 className="font-display text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FAQ</h2>
          <div className="grid gap-3 reveal-children">
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">How long does a booking take?</summary>
              <p className="text-sm text-black/70 mt-2">
                A standard small home (2–3 bedrooms) takes around 1.5–2 hours. Larger homes or shopfronts may take longer depending on size.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Can I reschedule or cancel?</summary>
              <p className="text-sm text-black/70 mt-2">
                Yes — rescheduling is free up to 24 hours before your booking. Cancellations within 24 hours may incur a small fee.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Do you service all Melbourne suburbs?</summary>
              <p className="text-sm text-black/70 mt-2">
                Yes. We cover Melbourne CBD, North, South, East, West, and Bayside suburbs. Just enter your postcode when booking to confirm.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">Are your cleaners insured and police-checked?</summary>
              <p className="text-sm text-black/70 mt-2">
                Absolutely. Every TidyJacks cleaner is fully insured, background-checked, and police-verified for your peace of mind.
              </p>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer font-medium">How does pricing work?</summary>
              <p className="text-sm text-black/70 mt-2">
                Our prices are fixed upfront based on your property type and size — no hidden fees.
              </p>
            </details>
          </div>
        </section>

        {/* Compliance banner */}
        <section className="py-8">
          <div className="rounded-2xl border border-black/10 bg-black/[.03] p-4 sm:p-6 text-sm text-black/80">
            <ul className="space-y-1">
              <li><span className="font-medium">Insurance:</span> All TidyJacks cleaners are fully insured</li>
              <li><span className="font-medium">Police checks:</span> Every cleaner is vetted and background checked</li>
              <li><span className="font-medium">Workplace safety:</span> Following Australian WHS standards</li>
              <li><span className="font-medium">Secure payments:</span> Powered by Stripe & Afterpay</li>
            </ul>
          </div>
        </section>

        {/* CTA footer */}
        <section className="py-10 border-t border-black/10">
          <div className="text-center">
            <h3 className="font-display text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TidyJacks — Australia's window cleaning experts</h3>
            <p className="mt-2 text-black/70">Book trusted, insured, and police-checked window cleaners in minutes.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-sm text-black/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>©2025 TidyJacks</span>
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
            <a href="#" aria-label="Blog" className="px-3 py-1.5 rounded-lg border border-black/20 text-sm hover:bg-black/5">BLOG</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
