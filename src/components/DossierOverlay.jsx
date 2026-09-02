import React, { forwardRef, useState } from 'react';

const DossierOverlay = forwardRef(({ onClose }, ref) => {
  const [sliderValue, setSliderValue] = useState(250000);
  const maxEquity = 1000000;
  
  // Custom Apple-style font family for this component
  const systemFonts = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' };
  
  // Format numbers neatly
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div 
      ref={ref}
      className="fixed bottom-0 left-0 w-full h-[85vh] z-[200] rounded-t-[40px] border-t border-white/10 shadow-2xl overflow-hidden flex flex-col"
      style={{ 
        background: 'rgba(15, 15, 15, 0.6)', 
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        ...systemFonts,
        transform: 'translateY(100%)' // Initial state
      }}
    >
      {/* Drawer Handle */}
      <div className="w-full flex justify-center py-4 shrink-0" onClick={onClose} style={{ cursor: 'pointer' }}>
        <div className="w-16 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-24 pb-48 custom-scrollbar">
        
        {/* Header */}
        <div className="mb-10 mt-4 flex justify-between items-end">
            <div>
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-2">Investment Dossier</h2>
                <p className="text-[#A1A1A6] text-lg tracking-wide">22510 La Quilla Dr, Chatsworth</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </button>
        </div>

        {/* Section A: Bento Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-end min-h-[140px]">
                <h4 className="text-[#A1A1A6] text-sm font-medium mb-1">Market Growth</h4>
                <p className="text-white text-3xl font-semibold tracking-tight tabular-nums">+12% <span className="text-xl text-white/50">YOY</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-end min-h-[140px]">
                <h4 className="text-[#A1A1A6] text-sm font-medium mb-1">Status</h4>
                <p className="text-white text-3xl font-semibold tracking-tight">Turnkey Ready</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-end min-h-[140px] bg-gradient-to-br from-white/10 to-transparent">
                <h4 className="text-[#A1A1A6] text-sm font-medium mb-1">Location</h4>
                <p className="text-white text-3xl font-semibold tracking-tight">Prime Chatsworth</p>
            </div>
        </div>

        {/* Section B: Capital Equity Slider */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 mb-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-white text-xl font-medium mb-1">Capital Equity Calculator</h3>
                    <p className="text-[#A1A1A6] text-sm">Estimate your required capital injection.</p>
                </div>
                <div className="text-right">
                    <p className="text-[#A1A1A6] text-sm font-medium mb-1">Down Payment</p>
                    <p className="text-white text-4xl font-bold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(sliderValue)}
                    </p>
                </div>
            </div>
            
            {/* Custom Range Slider */}
            <div className="relative w-full h-12 flex items-center">
                <input 
                    type="range" 
                    min="100000" 
                    max={maxEquity} 
                    step="10000"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="apple-slider absolute w-full z-20 opacity-0 cursor-pointer h-full"
                />
                {/* Track Background */}
                <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden relative shadow-inner">
                    {/* Active Track */}
                    <div 
                        className="h-full bg-white transition-all duration-75 ease-out"
                        style={{ width: `${(sliderValue / maxEquity) * 100}%` }}
                    />
                </div>
                {/* Custom Thumb */}
                <div 
                    className="absolute w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10 border border-black/10 transition-transform duration-75 ease-out pointer-events-none"
                    style={{ left: `calc(${(sliderValue / maxEquity) * 100}% - 16px)` }}
                />
            </div>
            <div className="flex justify-between text-[#A1A1A6] text-xs font-medium mt-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span>$100k</span>
                <span>$1M+</span>
            </div>
        </div>

        {/* Section C: Architectural Gallery (Masonry) */}
        <div className="mb-8">
            <h3 className="text-white text-xl font-medium mb-6">Architectural Details</h3>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {/* Using extracted frames as gallery images */}
                {[
                    '/frames/02/frame_0048.webp',
                    '/frames/03/frame_0048.webp',
                    '/frames/04/frame_0048.webp',
                    '/frames/05/frame_0048.webp',
                    '/frames/06/frame_0048.webp',
                    '/frames/01/frame_0048.webp',
                ].map((src, i) => (
                    <div key={i} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in border border-white/5">
                        <img 
                            src={src} 
                            alt="Architecture detail" 
                            className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Section D: Sticky AI ISA Widget & Branding */}
      <div className="absolute bottom-0 left-0 w-full pt-16 pb-6 md:pb-8 px-6 md:px-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none flex flex-col items-center">
          
          <div className="max-w-2xl w-full mx-auto relative pointer-events-auto mb-8">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-30"></div>
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center px-4 py-2 shadow-2xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <input 
                      type="text" 
                      placeholder="Ask the AI agent about this property..." 
                      className="w-full bg-transparent border-none outline-none text-white px-4 text-sm font-medium placeholder:text-white/40"
                  />
                  <button className="text-white/80 hover:text-white shrink-0 p-2 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
              </div>
          </div>

          {/* FOVIA Signature */}
          <div className="pointer-events-auto flex items-center justify-center">
              <p className="text-[rgba(255,255,255,0.4)] text-[11px] md:text-xs font-light transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] cursor-default">
                  Experience driven by <span className="uppercase font-medium tracking-[0.25em] ml-1">FOVIA</span>
              </p>
          </div>

      </div>

    </div>
  );
});

export default DossierOverlay;
