import React, { forwardRef, useState } from 'react';

const DossierOverlay = forwardRef(({ onClose }, ref) => {
  const [sliderValue, setSliderValue] = useState(2500000);

  // Format numbers to USD
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      ref={ref} 
      className="fixed top-0 right-0 w-full md:w-[480px] h-screen z-[200] translate-x-full will-change-transform shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.5)] bg-[rgba(15,15,15,0.75)] backdrop-blur-[30px] flex flex-col font-sans border-l border-white/10"
    >
      {/* Sticky Header */}
      <div className="flex justify-between items-center p-6 md:p-8 border-b border-white/10 shrink-0">
        <h2 className="text-white font-medium uppercase tracking-[0.15em] text-sm flex items-center gap-3">
          FOVIA <span className="text-white/30">//</span> INTELLIGENCE
        </h2>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar overscroll-contain">
        
        {/* Section A: Metrics Bento Box (Translated) */}
        <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-end min-h-[140px] col-span-2">
                <h4 className="text-[#A1A1A6] text-xs uppercase tracking-widest font-medium mb-1">Lokalizacja</h4>
                <p className="text-white text-2xl font-semibold tracking-tight">Chatsworth, CA <span className="text-lg text-white/50">91311</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-end min-h-[140px]">
                <h4 className="text-[#A1A1A6] text-xs uppercase tracking-widest font-medium mb-1">Wzrost Wartości</h4>
                <p className="text-white text-3xl font-semibold tracking-tight tabular-nums">+12% <span className="text-sm text-white/50">YOY</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-end min-h-[140px]">
                <h4 className="text-[#A1A1A6] text-xs uppercase tracking-widest font-medium mb-1">Status</h4>
                <p className="text-white text-sm font-semibold tracking-wide">Gotowe do zamieszkania</p>
            </div>
        </div>

        {/* Section B: Capital Calculator */}
        <div className="mb-12">
            <h3 className="text-white text-xl font-semibold mb-6">Kalkulator Kapitału</h3>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-[#A1A1A6] text-sm mb-1">Wymagany Wkład Własny</p>
                        <p className="text-4xl text-white font-medium tabular-nums tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(sliderValue)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#A1A1A6] text-sm mb-1">ROI (Szacowane)</p>
                        <p className="text-2xl text-white font-medium tabular-nums tracking-tight">
                            8.4%
                        </p>
                    </div>
                </div>

                {/* Custom CSS-styled slider */}
                <div className="relative w-full h-12 flex items-center">
                    <input 
                        type="range" 
                        min="500000" 
                        max="4795000" 
                        step="50000"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full appearance-none bg-transparent focus:outline-none z-10 cursor-grab active:cursor-grabbing"
                    />
                    {/* Fake Track */}
                    <div className="absolute left-0 right-0 h-2 bg-white/10 rounded-full overflow-hidden pointer-events-none">
                        <div 
                            className="h-full bg-white transition-all duration-75 ease-out"
                            style={{ width: `${((sliderValue - 500000) / (4795000 - 500000)) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-[#A1A1A6] tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <span>{formatCurrency(500000)}</span>
                    <span>{formatCurrency(4795000)}</span>
                </div>
            </div>
        </div>

        {/* Section C: Lead Generation Form */}
        <div className="mb-8">
            <h3 className="text-white text-xl font-semibold mb-2">Pobierz Pełny Prospekt & Rzuty (PDF)</h3>
            <p className="text-[#A1A1A6] text-sm mb-6">Wypełnij poniższy formularz, aby natychmiast otrzymać pakiet inwestycyjny bezpośrednio na WhatsApp.</p>
            
            <form className="flex flex-col gap-4">
                <input 
                    type="text" 
                    placeholder="Imię i Nazwisko" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors text-sm"
                />
                <input 
                    type="tel" 
                    placeholder="Numer Telefonu (WhatsApp)" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors text-sm"
                />
                <input 
                    type="email" 
                    placeholder="Adres E-mail" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors text-sm"
                />
                
                <button 
                    type="button" 
                    className="mt-4 w-full bg-white text-black font-semibold rounded-xl py-4 hover:scale-[1.02] hover:bg-zinc-200 transition-all duration-300 shadow-xl"
                >
                    Wyślij Prospekt na WhatsApp
                </button>
            </form>
        </div>

      </div>
    </div>
  );
});

export default DossierOverlay;
