export default function HeroDog() {
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      {/* Top card: image */}
      <div className="h-full relative overflow-hidden reveal card bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex items-center justify-center h-full p-8">
          {/* SVG Dog Illustration */}
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="w-full h-full max-w-48 max-h-48"
            aria-label="TidyJack dog illustration"
          >
            {/* Dog body */}
            <ellipse cx="100" cy="140" rx="40" ry="25" fill="#8B4513" />
            
            {/* Dog head */}
            <circle cx="100" cy="90" r="35" fill="#D2691E" />
            
            {/* Dog ears */}
            <ellipse cx="85" cy="70" rx="12" ry="20" fill="#8B4513" />
            <ellipse cx="115" cy="70" rx="12" ry="20" fill="#8B4513" />
            
            {/* Dog eyes */}
            <circle cx="90" cy="85" r="4" fill="#000" />
            <circle cx="110" cy="85" r="4" fill="#000" />
            <circle cx="91" cy="83" r="1" fill="#fff" />
            <circle cx="111" cy="83" r="1" fill="#fff" />
            
            {/* Dog nose */}
            <ellipse cx="100" cy="95" rx="3" ry="2" fill="#000" />
            
            {/* Dog mouth */}
            <path d="M100 98 Q95 102 90 100" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M100 98 Q105 102 110 100" stroke="#000" strokeWidth="2" fill="none" />
            
            {/* Dog legs */}
            <rect x="80" y="155" width="8" height="20" fill="#8B4513" />
            <rect x="92" y="155" width="8" height="20" fill="#8B4513" />
            <rect x="100" y="155" width="8" height="20" fill="#8B4513" />
            <rect x="112" y="155" width="8" height="20" fill="#8B4513" />
            
            {/* Cleaning brush in mouth */}
            <rect x="115" y="92" width="25" height="4" fill="#8B4513" />
            <rect x="140" y="90" width="15" height="8" fill="#FFD700" />
            
            {/* Bubbles */}
            <circle cx="60" cy="60" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="60;40;60" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="50" r="4" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="50;30;50" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="75" cy="35" r="3" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="35;20;35" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="40" r="5" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="40;25;40" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        
        {/* Speech bubble */}
        <div className="absolute top-6 left-6 bg-white rounded-2xl px-3 py-2 shadow-lg border border-black/10">
          <div className="text-sm font-medium text-gray-800">G'day, I'm Jack!</div>
          <div className="absolute -bottom-1 left-4 w-3 h-3 bg-white border-r border-b border-black/10 transform rotate-45"></div>
        </div>
      </div>

      {/* Bottom card: features */}
      <div className="h-full p-3 sm:p-4 md:p-6 reveal card" style={{"--reveal-delay":"90ms"} as React.CSSProperties}>
        <div className="flex flex-col justify-between h-full w-full">
          <div className="max-w-md text-left">
            <h3 className="font-display text-lg sm:text-xl font-semibold">Cleaning made easy</h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-black/80">
              <li className="flex items-start gap-2"><span>✔</span><span>Book in under 60 seconds, no calls or quotes needed</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Instant online payment with Afterpay available</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Experienced, insured, and police-checked professionals</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Notes & special requests welcome — we tailor to you</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>Satisfaction guarantee or we'll make it right</span></li>
              <li className="flex items-start gap-2"><span>✔</span><span>24/7 support team to help whenever you need</span></li>
            </ul>
          </div>
          
          {/* Trust badges */}
          <div className="mt-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Afterpay Available
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Police Checked
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                Insured
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
