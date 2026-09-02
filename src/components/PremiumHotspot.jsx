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
  const positions = {
    top: { 
      card: 'bottom-full left-1/2 -translate-x-1/2 mb-2 md:mb-4', 
      lineClasses: 'bottom-2 md:bottom-3 left-0 h-8 md:h-24 w-[1px] -translate-x-1/2 origin-bottom', 
      lineScale: 'scaleY(0)' 
    },
    bottom: { 
      card: 'top-full left-1/2 -translate-x-1/2 mt-2 md:mt-4', 
      lineClasses: 'top-2 md:top-3 left-0 h-8 md:h-24 w-[1px] -translate-x-1/2 origin-top', 
      lineScale: 'scaleY(0)' 
    },
    left: { 
      card: 'right-full top-1/2 -translate-y-1/2 mr-2 md:mr-4', 
      lineClasses: 'right-2 md:right-3 top-0 w-8 md:w-24 h-[1px] -translate-y-1/2 origin-right', 
      lineScale: 'scaleX(0)' 
    },
    right: { 
      card: 'left-full top-1/2 -translate-y-1/2 ml-2 md:ml-4', 
      lineClasses: 'left-2 md:left-3 top-0 w-8 md:w-24 h-[1px] -translate-y-1/2 origin-left', 
      lineScale: 'scaleX(0)' 
    }
  };

  return (
    <div 
      className={`hotspot-${id} absolute z-[70] flex items-center justify-center w-0 h-0 ${className}`}
      style={{ top, left, visibility: 'hidden' }}
    >
      {/* 1. Focus Ring */}
      <div className="ring absolute w-10 h-10 rounded-full border-[1px] border-white/30" style={{ transform: 'scale(0.2)', opacity: 0 }} />
      
      {/* 2. Core Dot */}
      <div className="dot absolute w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" style={{ opacity: 0 }} />

      {/* 3. Connecting Line */}
      <div className={`line absolute bg-white/60 ${positions[direction].lineClasses}`} style={{ transform: positions[direction].lineScale }} />

      {/* 4. Glassmorphic Card */}
      <div 
        className={`card absolute w-[170px] md:w-80 backdrop-blur-2xl bg-black/70 border border-white/20 p-3 md:p-5 shadow-2xl ${positions[direction].card}`} 
        style={{ opacity: 0 }}
      >
        <div className="relative z-10">
            <h4 className="font-sans text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-white/70 mb-1">{subtitle}</h4>
            <h3 className="font-sans text-sm md:text-xl font-medium text-white drop-shadow-lg leading-tight mb-2 md:mb-4">{title}</h3>
            
            <div className="h-[1px] w-full bg-gradient-to-r from-white/40 to-transparent mb-2 md:mb-4" />
            
            <div className="flex flex-col md:flex-row gap-1 md:gap-6">
                <div>
                    <p className="font-sans text-[8px] md:text-[9px] uppercase tracking-widest text-white/60 mb-0.5 md:mb-1">{spec1}</p>
                    <p className="font-sans text-[11px] md:text-sm font-semibold text-white drop-shadow-sm">{spec2}</p>
                </div>
            </div>
        </div>
        
        {/* Subtle glass reflection highlight */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
