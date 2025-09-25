export default function HeroDog() {
  const bubbles = [
    { size: 32, left: '6%',  top: '72%', duration: 18, delay: 0 },
    { size: 18, left: '14%', top: '80%', duration: 14, delay: 0.6 },
    { size: 22, left: '24%', top: '75%', duration: 20, delay: 1.2 },
    { size: 36, left: '36%', top: '78%', duration: 22, delay: 0.9 },
    { size: 26, left: '50%', top: '76%', duration: 19, delay: 1.5 },
    { size: 20, left: '62%', top: '80%', duration: 16, delay: 0.3 },
    { size: 34, left: '74%', top: '74%', duration: 21, delay: 1.1 },
    { size: 20, left: '86%', top: '79%', duration: 17, delay: 0.7 },
    { size: 38, left: '12%', top: '60%', duration: 24, delay: 1.7 },
    { size: 16, left: '44%', top: '62%', duration: 15, delay: 0.2 },
    { size: 24, left: '70%', top: '60%', duration: 20, delay: 1.4 },
    { size: 18, left: '90%', top: '62%', duration: 16, delay: 0.8 },
    { size: 14, left: '8%',  top: '56%', duration: 12, delay: 0.4 },
    { size: 18, left: '32%', top: '58%', duration: 14, delay: 1.0 },
    { size: 22, left: '58%', top: '58%', duration: 18, delay: 0.5 },
    { size: 16, left: '80%', top: '56%', duration: 12, delay: 1.3 },
  ]
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      {/* Top card: image */}
      <div className="h-full relative overflow-hidden reveal card bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="flex items-center justify-center h-full p-2 sm:p-4 relative">
          {/* Dog Image */}
          <img
            src="/jacks.png"
            alt="TidyJacks mascot"
            className="w-full h-full max-w-xs sm:max-w-none object-contain z-10"
          />
          
          {/* Soft Translucent Bubbles (above image) */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
            {/* Animated bubbles rising and drifting */}
            {bubbles.map((b, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: b.left,
                  top: b.top,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  background:
                    'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(173,216,230,0.55) 45%, rgba(135,206,235,0.28) 65%, rgba(135,206,235,0.12) 100%)',
                  boxShadow: 'inset 0 0 10px rgba(255,255,255,0.85), 0 4px 12px rgba(135,206,235,0.35)',
                  opacity: 1,
                  animation: `bubbleDrift ${b.duration}s ease-in-out ${b.delay}s infinite alternate, bubbleRise ${b.duration * 1.6}s linear ${b.delay}s infinite`,
                  mixBlendMode: 'screen'
                }}
              />
            ))}
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
