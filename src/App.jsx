import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import PremiumHotspot from './components/PremiumHotspot';
import DossierOverlay from './components/DossierOverlay';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("apple", "0.32, 0.72, 0, 1");

const frameCounts = [96, 96, 96, 96, 96, 96, 96, 96];
const totalVideos = frameCounts.length;

// Configuration for segment durations
const segmentsConfig = frameCounts.map((count, i) => {
  const isHotspot = i >= 1 && i <= 6;
  return {
    index: i,
    frames: count,
    baseDuration: 2.0,
    hotspotDuration: isHotspot ? 2.5 : 0.0,
    pauseFrame: 48,
  };
});

// Precompute timeline positions
let accumulatedScroll = 0;
const segmentStarts = segmentsConfig.map(seg => {
  const start = accumulatedScroll;
  accumulatedScroll += seg.baseDuration + seg.hotspotDuration;
  return start;
});
const totalScrollDuration = accumulatedScroll;

function useFrameLoader() {
  const [loadedFrames, setLoadedFrames] = useState(0);
  const totalFrames = frameCounts.reduce((a, b) => a + b, 0);
  const framesRef = useRef(Array.from({ length: totalVideos }, () => []));

  useEffect(() => {
    let loaded = 0;
    const loadAll = async () => {
      const allPromises = [];
      for (let i = 0; i < totalVideos; i++) {
        const count = frameCounts[i];
        const folder = String(i + 1).padStart(2, '0');
        
        for (let f = 1; f <= count; f++) {
          const promise = new Promise((resolve) => {
            const img = new Image();
            const frameNum = String(f).padStart(4, '0');
            img.src = `/frames/${folder}/frame_${frameNum}.webp`;
            
            img.onload = () => {
              loaded++;
              if (loaded % 20 === 0 || loaded === totalFrames) {
                setLoadedFrames(loaded);
              }
              resolve(img);
            };
            img.onerror = () => {
              loaded++;
              if (loaded % 20 === 0 || loaded === totalFrames) {
                setLoadedFrames(loaded);
              }
              resolve(img);
            };
          }).then((img) => {
            framesRef.current[i][f - 1] = img;
          });
          allPromises.push(promise);
        }
      }
      await Promise.all(allPromises);
    };
    loadAll();
  }, []);

  return { loadedFrames, totalFrames, framesRef };
}

const IMAGE_SCALE = 1;

function drawFrame(ctx, canvas, img) {
  if (!img || !img.naturalWidth) return;
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0) return;

  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

export default function App() {
  const containerRef = useRef(null);
  const mainWrapperRef = useRef(null);
  const dossierRef = useRef(null);
  const canvasRefs = useRef([]);
  const textRefs = useRef([]);
  
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const { loadedFrames, totalFrames, framesRef } = useFrameLoader();
  const isLoaded = loadedFrames === totalFrames && totalFrames > 0;

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    
    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      canvasRefs.current.forEach((canvas, i) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        
        const img = framesRef.current[i]?.[0];
        if (img) drawFrame(ctx, canvas, img);
      });
    };
    
    if (isLoaded) {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  useGSAP(() => {
    if (!isLoaded) return;
    
    canvasRefs.current.forEach((canvas, i) => {
      if (canvas) {
        gsap.set(canvas, { 
          zIndex: totalVideos - i, 
          opacity: 1 
        }); 
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${totalScrollDuration * 100}%`,
        scrub: 0,
        pin: true,
      }
    });

    framesRef.current.forEach((frames, i) => {
      const canvas = canvasRefs.current[i];
      const text = textRefs.current[i];
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || frames.length === 0) return;

      const proxy = { frame: 0 };
      const maxFrame = frames.length - 1;
      const updateFrame = () => {
        const fIndex = Math.round(proxy.frame);
        drawFrame(ctx, canvas, frames[fIndex]);
      };
      
      const seg = segmentsConfig[i];
      const segmentStart = segmentStarts[i];
      const nextSegmentStart = segmentStarts[i + 1] || totalScrollDuration;

      const scrubStart = i === 0 ? 0 : segmentStart - 0.6; 
      const scrubEnd = nextSegmentStart;
      const scrubDuration = scrubEnd - scrubStart;

      // 1. Scrub frames (with possible hotspot pause)
      if (seg.hotspotDuration > 0) {
        const part1Ratio = seg.pauseFrame / maxFrame;
        const baseScrubTime = scrubDuration - seg.hotspotDuration;
        const part1Duration = baseScrubTime * part1Ratio;
        
        const pauseStart = scrubStart + part1Duration;
        const pauseEnd = pauseStart + seg.hotspotDuration;
        const part2Duration = baseScrubTime * (1 - part1Ratio);

        // Fly In
        tl.to(proxy, { frame: seg.pauseFrame, duration: part1Duration, ease: "none", onUpdate: updateFrame }, scrubStart);
        
        // Pause & Animate Hotspots
        const hotspots = `.hotspot-vid-${i}`;
        const dimmer = `.dimmer-vid-${i}`;
        const animStart = pauseStart;
        
        // Dim background (Depth of Field effect)
        tl.set(dimmer, { visibility: 'visible' }, animStart);
        tl.to(dimmer, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, animStart);
        
        tl.set(hotspots, { visibility: 'visible' }, animStart);
        
        // Sequence: Ring -> Dot -> Line -> Card
        tl.to(`${hotspots} .ring`, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.1 }, animStart + 0.1);
        tl.to(`${hotspots} .dot`, { autoAlpha: 1, duration: 0.3, stagger: 0.1 }, animStart + 0.3);
        tl.to(`${hotspots} .line`, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "power3.out", stagger: 0.1 }, animStart + 0.4);
        tl.to(`${hotspots} .card`, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: "expo.out", stagger: 0.1 }, animStart + 0.6);
        
        // Fade out everything before resuming
        const fadeOutStart = pauseEnd - 0.5;
        tl.to(dimmer, { autoAlpha: 0, duration: 0.4 }, fadeOutStart);
        tl.to(hotspots, { autoAlpha: 0, duration: 0.4 }, fadeOutStart);
        
        tl.set(hotspots, { visibility: 'hidden' }, pauseEnd);
        tl.set(`${hotspots} .card`, { clipPath: 'inset(0 100% 0 0)' }, pauseEnd);
        tl.set(`${hotspots} .line`, { scaleX: 0, scaleY: 0 }, pauseEnd);
        tl.set(dimmer, { visibility: 'hidden' }, pauseEnd);

        // Fly Out
        tl.to(proxy, { frame: maxFrame, duration: part2Duration, ease: "none", onUpdate: updateFrame }, pauseEnd);
      } else {
        // Normal Scrub
        tl.to(proxy, { frame: maxFrame, duration: scrubDuration, ease: "none", onUpdate: updateFrame }, scrubStart);
      }

      // 2. Crossfade & Push Transition
      if (i < totalVideos - 1) {
        const nextCanvas = canvasRefs.current[i + 1];
        const transitionStart = nextSegmentStart - 0.6; 
        const transitionDuration = 0.6;
        
        tl.to(canvas, { 
          scale: 1.8, filter: "blur(20px)", opacity: 0, duration: transitionDuration, ease: "power2.inOut" 
        }, transitionStart);
        
        tl.fromTo(nextCanvas, 
          { scale: 1 }, { scale: 1.05, duration: transitionDuration, ease: "none" }, transitionStart
        );
      }

      // 3. Text Overlays (Staggered bridging)
      if (text) {
        if (i === 0) {
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
            segmentStart + 0.2
          );
          tl.to(text,
            { autoAlpha: 0, y: -40, filter: "blur(15px)", duration: 0.5, ease: "power2.in" },
            segmentStart + 0.8 
          );
        } else if (i === totalVideos - 1) {
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" },
            segmentStart + 0.6
          );
        } else {
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
            segmentStart - 0.7 
          );
          tl.to(text,
            { autoAlpha: 0, y: -40, filter: "blur(15px)", duration: 0.6, ease: "power2.in" },
            segmentStart + 0.6 
          );
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef, dependencies: [isLoaded] });

  // Handle Dossier Animation
  useEffect(() => {
    if (!mainWrapperRef.current || !dossierRef.current) return;
    if (isDossierOpen) {
      gsap.to(mainWrapperRef.current, {
        scale: 0.95,
        filter: "blur(20px)",
        duration: 0.8,
        ease: "apple"
      });
      gsap.to(dossierRef.current, {
        y: "0%",
        duration: 0.8,
        ease: "apple"
      });
    } else {
      gsap.to(mainWrapperRef.current, {
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "apple"
      });
      gsap.to(dossierRef.current, {
        y: "100%",
        duration: 0.8,
        ease: "apple"
      });
    }
  }, [isDossierOpen]);

  const textOverlays = [
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-[60] align-left">
        <div className="section-inner">
            <h1 className="font-serif text-5xl md:text-8xl font-light tracking-wide text-white drop-shadow-2xl mb-4">22510 La Quilla Dr</h1>
            <p className="font-sans text-sm md:text-2xl font-light tracking-[0.3em] uppercase text-zinc-200 drop-shadow-lg mb-6">Chatsworth, California</p>
            <p className="font-sans text-2xl md:text-4xl font-light tracking-[0.1em] text-white drop-shadow-lg">$4,795,000</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-[60] align-left">
        <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">The Grounds</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Pool & Spa</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-[60] align-left">
         <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Grand Entrance</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Soaring Ceilings</p>
         </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 right-8 md:right-24 z-[60] align-right text-right">
        <div className="section-inner ml-auto">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Living Area</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Expansive & Bright</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-[60] align-left">
        <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Chef's Kitchen</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">State-of-the-Art</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 right-8 md:right-24 z-[60] align-right text-right">
        <div className="section-inner ml-auto">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Entertainment</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Private Lounge</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-[60] align-left">
        <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Master Suite & Baths</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl mb-8">Refined Luxury</p>
            <div className="flex flex-col gap-4 text-xl md:text-3xl font-sans font-light tracking-[0.2em] text-white/80 drop-shadow-xl">
                <span>5 Beds</span>
                <span>6 Baths</span>
                <span>7,467 SQFT</span>
            </div>
        </div>
      </div>
    ),
    (
      <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none">
        <div className="w-full max-w-xl p-10 md:p-16 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <h3 className="font-serif text-4xl md:text-6xl font-light mb-6 text-center text-white drop-shadow-2xl">The Estate</h3>
          <p className="font-sans text-xs md:text-sm tracking-[0.4em] text-zinc-300 mb-12 text-center uppercase drop-shadow-md">Listed by Luxury Agents</p>
          <form className="flex flex-col gap-8 font-sans text-sm md:text-base">
            <input type="text" placeholder="Name" className="bg-transparent border-b border-white/50 text-white pb-3 outline-none focus:border-white transition-colors placeholder:text-white/60 shadow-sm" />
            <input type="email" placeholder="Email" className="bg-transparent border-b border-white/50 text-white pb-3 outline-none focus:border-white transition-colors placeholder:text-white/60 shadow-sm" />
            <button type="button" className="mt-8 bg-white/90 text-black py-5 px-10 uppercase tracking-[0.3em] text-xs font-semibold hover:bg-white transition-colors shadow-2xl hover:scale-[1.02] duration-300">
              Request Private Showing
            </button>
          </form>
        </div>
      </div>
    ),
  ];

  return (
    <div className="bg-black w-full min-h-screen font-sans selection:bg-white/20 overflow-hidden">
      
      {/* Cinematic Preloader */}
      <div 
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111] transition-all duration-[2000ms] ease-in-out ${
          isLoaded ? 'opacity-0 pointer-events-none scale-105 filter blur-md' : 'opacity-100 scale-100 filter blur-0'
        }`}
      >
        <h2 className="text-white font-serif text-4xl md:text-7xl font-light tracking-widest mb-12 opacity-90 drop-shadow-2xl">The Estate</h2>
        <div className="w-64 md:w-96 h-[1px] bg-white/10 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${totalFrames > 0 ? (loadedFrames / totalFrames) * 100 : 0}%` }}
          />
        </div>
        <p className="text-white/40 mt-6 font-sans text-xs tracking-widest uppercase">
          Loading {Math.round(totalFrames > 0 ? (loadedFrames / totalFrames) * 100 : 0)}%
        </p>
      </div>

      <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
        {/* Main Wrapper for Scaling and Blurring when Dossier opens */}
        <div ref={mainWrapperRef} className="absolute inset-0 origin-bottom will-change-transform">
            {frameCounts.map((_, i) => (
            <canvas
                key={`canvas-${i}`}
                ref={el => canvasRefs.current[i] = el}
                className="absolute inset-0 w-full h-full block origin-center will-change-transform"
            />
            ))}

            {/* Global Dimmers for Depth of Field effect */}
            {segmentsConfig.map((seg, i) => seg.hotspotDuration > 0 && (
            <div key={`dimmer-${i}`} className={`dimmer-vid-${i} absolute inset-0 bg-black/20 z-[50] pointer-events-none`} style={{ opacity: 0, visibility: 'hidden' }} />
            ))}

            {/* --- HOTSPOTS --- */}
            <div className="absolute inset-0 z-[55] pointer-events-none">
            
            {/* Video 1: Pool & Spa */}
            <PremiumHotspot id="1-1" className="hotspot-vid-1" title="Infinity Edge" subtitle="Architectural Water Feature" spec1="Design" spec2="Seamless Horizon" top="65%" left="45%" direction="right" />
            <PremiumHotspot id="1-2" className="hotspot-vid-1" title="Cascading Spa" subtitle="Custom Built" spec1="Capacity" spec2="12-Person" top="75%" left="75%" direction="top" />

            {/* Video 2: Entrance */}
            <PremiumHotspot id="2-1" className="hotspot-vid-2" title="Crystal Chandelier" subtitle="Foyer Lighting" spec1="Origin" spec2="Imported Italian" top="20%" left="50%" direction="right" />
            <PremiumHotspot id="2-2" className="hotspot-vid-2" title="Vaulted Ceilings" subtitle="Grand Scale" spec1="Height" spec2="24 Feet" top="15%" left="25%" direction="bottom" />

            {/* Video 3: Living Room */}
            <PremiumHotspot id="3-1" className="hotspot-vid-3" title="Artisan Fireplace" subtitle="Custom Stonework" spec1="Material" spec2="Italian Travertine" top="55%" left="15%" direction="right" />
            <PremiumHotspot id="3-2" className="hotspot-vid-3" title="Hardwood Flooring" subtitle="Wide Plank" spec1="Wood Type" spec2="European Oak" top="75%" left="55%" direction="left" />

            {/* Video 4: Kitchen */}
            <PremiumHotspot id="4-1" className="hotspot-vid-4" title="Calacatta Gold" subtitle="Chef's Island" spec1="Finish" spec2="Honed Marble" top="65%" left="45%" direction="left" />
            <PremiumHotspot id="4-2" className="hotspot-vid-4" title="Sub-Zero & Wolf" subtitle="Integrated Appliances" spec1="Series" spec2="Professional Grade" top="35%" left="70%" direction="bottom" />

            {/* Video 5: Entertainment */}
            <PremiumHotspot id="5-1" className="hotspot-vid-5" title="Acoustic Paneling" subtitle="Theater Grade" spec1="Rating" spec2="Studio Quality" top="40%" left="20%" direction="right" />
            <PremiumHotspot id="5-2" className="hotspot-vid-5" title="Bespoke Wet Bar" subtitle="Entertainment Lounge" spec1="Counter" spec2="Backlit Onyx" top="60%" left="80%" direction="left" />

            {/* Video 6: Master Suite */}
            <PremiumHotspot id="6-1" className="hotspot-vid-6" title="Panoramic Windows" subtitle="Valley Views" spec1="Glass" spec2="Floor-to-Ceiling" top="30%" left="30%" direction="right" />
            <PremiumHotspot id="6-2" className="hotspot-vid-6" title="Spa Soaking Tub" subtitle="Primary Bath" spec1="Placement" spec2="Freestanding" top="65%" left="70%" direction="top" />

            </div>

            {/* Elegant Gradient for Typography */}
            <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-40 pointer-events-none mix-blend-multiply" />

            {/* Text Containers */}
            {textOverlays.map((content, i) => (
            <div
                key={i}
                ref={el => textRefs.current[i] = el}
                className="absolute inset-0 z-[60] pointer-events-none flex flex-col justify-end will-change-transform"
                style={{ opacity: 0, visibility: 'hidden' }}
            >
                {content}
            </div>
            ))}
        </div>
      </div>
      
      {/* Dossier Component */}
      <DossierOverlay ref={dossierRef} onClose={() => setIsDossierOpen(false)} />

      {/* Floating Action Button */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] transition-opacity duration-500 ${isDossierOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <button 
            onClick={() => setIsDossierOpen(true)}
            className="group relative px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-sans text-sm tracking-widest uppercase hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            Explore Dossier
        </button>
      </div>
      
    </div>
  );
}
