export default function HeroDog() {
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      {/* Top card: image */}
      <div className="h-full relative overflow-hidden reveal card bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex items-center justify-center h-full p-8">
          {/* Dog Image */}
          <img
            src="/dog.png"
            alt="TidyJack dog illustration"
            className="w-full h-full max-w-48 max-h-48 object-contain"
          />
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
