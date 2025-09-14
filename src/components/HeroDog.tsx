export default function HeroDog() {
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      {/* Top card: image */}
      <div className="h-full relative overflow-hidden reveal card bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex items-center justify-center h-full p-4 relative">
          {/* Dog Image */}
          <img
            src="/dog.png"
            alt="TidyJack dog illustration"
            className="w-full h-full object-contain z-10"
          />
          
          {/* Animated Bubbles and Sparkles */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
            {/* Bubble 1 - Large */}
            <circle cx="120" cy="80" r="12" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="80;60;80" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* Bubble 2 - Medium */}
            <circle cx="300" cy="70" r="8" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="70;50;70" dur="2.5s" repeatCount="indefinite" />
            </circle>
            
            {/* Bubble 3 - Small */}
            <circle cx="150" cy="50" r="6" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="50;35;50" dur="2s" repeatCount="indefinite" />
            </circle>
            
            {/* Bubble 4 - Medium */}
            <circle cx="260" cy="60" r="10" fill="rgba(255,255,255,0.7)" stroke="rgba(0,150,255,0.3)" strokeWidth="1">
              <animate attributeName="cy" values="60;45;60" dur="2.8s" repeatCount="indefinite" />
            </circle>
            
            {/* Sparkle 1 */}
            <g transform="translate(80,90)">
              <path d="M0,-8 L2,2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,2 Z" fill="rgba(255,255,255,0.8)">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite"/>
              </path>
            </g>
            
            {/* Sparkle 2 */}
            <g transform="translate(320,100)">
              <path d="M0,-6 L1.5,1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,1.5 Z" fill="rgba(255,255,255,0.8)">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="3s" repeatCount="indefinite"/>
              </path>
            </g>
            
            {/* Sparkle 3 */}
            <g transform="translate(200,40)">
              <path d="M0,-4 L1,1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,1 Z" fill="rgba(255,255,255,0.8)">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="5s" repeatCount="indefinite"/>
              </path>
            </g>
            
            {/* Small dots/sparkles */}
            <circle cx="180" cy="120" r="2" fill="rgba(255,255,255,0.6)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="140" r="1.5" fill="rgba(255,255,255,0.6)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="130" r="2.5" fill="rgba(255,255,255,0.6)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" />
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
