import React from 'react';

export default function PremiumHotspot({ 
  id, 
  title, 
  subtitle, 
  spec1, 
  spec2, 
  top, 
  left, 
  direction = 'right',
  className = ''
}) {
  let lineClasses = "";
  let cardClasses = "";

  switch (direction) {
    case 'right':
      lineClasses = "left-3 top-0 w-16 md:w-24 h-[1px] -translate-y-1/2 origin-left";
      cardClasses = "left-[calc(0.75rem+4rem)] md:left-[calc(0.75rem+6rem)] top-0 -translate-y-1/2";
      break;
    case 'left':
      lineClasses = "right-3 top-0 w-16 md:w-24 h-[1px] -translate-y-1/2 origin-right";
      cardClasses = "right-[calc(0.75rem+4rem)] md:right-[calc(0.75rem+6rem)] top-0 -translate-y-1/2";
      break;
    case 'top':
      lineClasses = "bottom-3 left-0 h-16 md:h-24 w-[1px] -translate-x-1/2 origin-bottom";
      cardClasses = "bottom-[calc(0.75rem+4rem)] md:bottom-[calc(0.75rem+6rem)] left-0 -translate-x-1/2";
      break;
    case 'bottom':
      lineClasses = "top-3 left-0 h-16 md:h-24 w-[1px] -translate-x-1/2 origin-top";
      cardClasses = "top-[calc(0.75rem+4rem)] md:top-[calc(0.75rem+6rem)] left-0 -translate-x-1/2";
      break;
  }

  return (
    <div 
      className={`hotspot-${id} absolute z-[70] flex items-center justify-center w-0 h-0 ${className}`}
      style={{ top, left, visibility: 'hidden', opacity: 0 }}
    >
      {/* 1. Focus Ring */}
      <div className="ring absolute w-10 h-10 rounded-full border-[1px] border-white/30" style={{ transform: 'scale(0.2)', opacity: 0 }} />
      
      {/* 2. Core Dot */}
      <div className="dot absolute w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" style={{ opacity: 0 }} />

      {/* 3. Connecting Line */}
      <div className={`line absolute bg-white/60 ${lineClasses}`} style={{ transform: direction === 'left' || direction === 'right' ? 'scaleX(0)' : 'scaleY(0)' }} />

      {/* 4. Glassmorphic Card */}
      <div 
        className={`card absolute w-56 md:w-72 bg-black/40 backdrop-blur-2xl border border-white/10 p-5 shadow-2xl overflow-hidden ${cardClasses}`}
        style={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
      >
        <div className="relative z-10">
            <h4 className="font-sans text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/50 mb-1.5">{subtitle}</h4>
            <h3 className="font-serif text-lg md:text-xl font-light text-white drop-shadow-md mb-4">{title}</h3>
            
            <div className="h-[1px] w-full bg-gradient-to-r from-white/30 to-transparent mb-4" />
            
            <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10px] md:text-xs font-sans">
                    <span className="text-white/40 tracking-widest uppercase">Feature</span>
                    <span className="text-white/90 tracking-widest uppercase text-right">{spec1}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs font-sans">
                    <span className="text-white/40 tracking-widest uppercase">Material</span>
                    <span className="text-white/90 tracking-widest uppercase text-right">{spec2}</span>
                </div>
            </div>
        </div>
        
        {/* Subtle glass reflection highlight */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
