export default function HeroDog() {
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      {/* Top card: image */}
      <div className="h-full relative overflow-hidden reveal card bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="flex items-center justify-center h-full p-2 sm:p-4 relative">
          {/* Dog Image */}
          <img
            src="/Jacks.png"
            alt="TidyJacks mascot"
            className="w-full h-full max-w-xs sm:max-w-none object-contain z-10"
          />
          
          {/* Soft Translucent Bubbles */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Large soft bubble */}
            <div 
              className="absolute top-16 right-20 w-16 h-16 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, rgba(240,240,255,0.1) 100%)',
                animation: 'float 4s ease-in-out infinite'
              }}
            ></div>
            
            {/* Medium soft bubble */}
            <div 
              className="absolute top-24 left-24 w-12 h-12 rounded-full opacity-25"
              style={{
                background: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 60%, rgba(255,240,255,0.1) 100%)',
                animation: 'float 3.5s ease-in-out infinite 0.5s'
              }}
            ></div>
            
            {/* Small soft bubble */}
            <div 
              className="absolute top-8 right-32 w-8 h-8 rounded-full opacity-35"
              style={{
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 50%, rgba(240,255,255,0.05) 100%)',
                animation: 'float 2.8s ease-in-out infinite 1s'
              }}
            ></div>
            
            {/* Another medium bubble */}
            <div 
              className="absolute top-20 left-40 w-10 h-10 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 70%, rgba(255,250,255,0.05) 100%)',
                animation: 'float 3.2s ease-in-out infinite 1.5s'
              }}
            ></div>
          </div>
          
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-10px) scale(1.05); }
            }
          `}</style>
        </div>
        
        {/* Speech bubble */}
        <div className="absolute top-8 left-8 sm:top-16 sm:left-16 bg-white rounded-2xl px-2 py-1 sm:px-3 sm:py-2 shadow-lg border border-black/10 z-20 hover:scale-110 transition-transform duration-300">
          <div className="text-xs sm:text-sm font-medium text-gray-800">
            <span 
              className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-gray-800 animate-pulse"
              style={{
                animation: 'typewriter 4s steps(16, end) infinite, blink 1s step-end infinite'
              }}
            >
              G'day, I'm Jacks!
            </span>
          </div>
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 w-3 h-3 bg-white border-r border-b border-black/10 rotate-45"></div>
        </div>
        
        <style>{`
          @keyframes typewriter {
            0% { width: 0; }
            50% { width: 100%; }
            100% { width: 100%; }
          }
          
          @keyframes blink {
            0%, 50% { border-color: transparent; }
            51%, 100% { border-color: #374151; }
          }
        `}</style>
      </div>

      {/* Bottom card: features */}
      <div className="h-full p-3 sm:p-4 md:p-6 reveal card" style={{"--reveal-delay":"90ms"} as React.CSSProperties}>
        <div className="flex flex-col justify-between h-full w-full">
          <div className="max-w-md text-left">
            <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold">Cleaning made easy</h3>
            <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 text-xs sm:text-sm text-black/80">
              <li className="flex items-start gap-2"><span>✔</span><span>Book in under 60 seconds, no calls or quotes needed</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Instant online payment</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Experienced local professionals</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Notes & special requests welcome — we tailor to you</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Satisfaction guarantee or we'll make it right</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>24/7 support team to help whenever you need</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Tailored services — from windows to deep cleans</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Join hundreds of Aussies who trust TidyJacks</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Walk into a fresh, clean space every time</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Less stress, more shine</span></li>
            </ul>
          </div>
          
          {/* Trust badges removed as requested */}
        </div>
      </div>
    </div>
  )
}
