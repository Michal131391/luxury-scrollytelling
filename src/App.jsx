import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const frameCounts = [96, 96, 96, 96, 96, 96, 96, 96];
const totalVideos = frameCounts.length;

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
  const canvasRefs = useRef([]);
  const textRefs = useRef([]);
  
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
        end: `+=${totalVideos * 200}%`,
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
      
      const segmentStart = i * 2;
      
      // Calculate exactly when this video becomes visible and when it disappears
      // This ensures the video is playing *during* the crossfade, not static
      const scrubStart = i === 0 ? 0 : segmentStart - 0.6; // Matches the previous transition start (segmentStart - 2 + 1.4)
      const scrubEnd = segmentStart + 2.0; // The end of its own transition
      const scrubDuration = scrubEnd - scrubStart;

      // 1. Scrub frames continuously for the entire duration it is visible
      tl.to(proxy, {
        frame: maxFrame,
        duration: scrubDuration,
        ease: "none",
        onUpdate: () => {
          const fIndex = Math.round(proxy.frame);
          drawFrame(ctx, canvas, frames[fIndex]);
        }
      }, scrubStart);

      // 2. Crossfade & Push Transition (Apple-style)
      if (i < totalVideos - 1) {
        const nextCanvas = canvasRefs.current[i + 1];
        const transitionStart = segmentStart + 1.4; 
        const transitionDuration = 0.6;
        
        // Current canvas scales massively, blurs, and fades out
        tl.to(canvas, { 
          scale: 1.8, 
          filter: "blur(20px)",
          opacity: 0,
          duration: transitionDuration, 
          ease: "power2.inOut" 
        }, transitionStart);
        
        // Next canvas starts slightly pushed in and continues to slowly push forward
        // to maintain the forward momentum without jarring scale jumps
        tl.fromTo(nextCanvas, 
          { scale: 1 },
          { scale: 1.05, duration: transitionDuration, ease: "none" },
          transitionStart
        );
      }

      // 3. Text Overlays (Staggered to bridge transitions and mask friction)
      if (text) {
        if (i === 0) {
          // Intro: fade in fast, fade out just before transition
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
            segmentStart + 0.2
          );
          tl.to(text,
            { autoAlpha: 0, y: -40, filter: "blur(15px)", duration: 0.5, ease: "power2.in" },
            segmentStart + 0.8 // Gone by 1.3
          );
        } else if (i === totalVideos - 1) {
          // Final Contact Form: fades in on the last scene
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out" },
            segmentStart + 0.6
          );
        } else {
          // Bridging texts (1 to 6)
          const prevSegmentStart = (i - 1) * 2;
          
          // Enter: exactly as the previous background begins its blurred scale-up
          tl.fromTo(text, 
            { autoAlpha: 0, y: 40, filter: "blur(15px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
            prevSegmentStart + 1.3 
          );
          
          // Exit: mid-way through the current scene, leaving breathing room before next transition
          tl.to(text,
            { autoAlpha: 0, y: -40, filter: "blur(15px)", duration: 0.6, ease: "power2.in" },
            segmentStart + 0.6 // Gone by (segmentStart + 1.2)
          );
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef, dependencies: [isLoaded] });

  const textOverlays = [
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-30 align-left">
        <div className="section-inner">
            <h1 className="font-serif text-5xl md:text-8xl font-light tracking-wide text-white drop-shadow-2xl mb-4">22510 La Quilla Dr</h1>
            <p className="font-sans text-sm md:text-2xl font-light tracking-[0.3em] uppercase text-zinc-200 drop-shadow-lg mb-6">Chatsworth, California</p>
            <p className="font-sans text-2xl md:text-4xl font-light tracking-[0.1em] text-white drop-shadow-lg">$4,795,000</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-30 align-left">
        <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">The Grounds</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Pool & Spa</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-30 align-left">
         <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Grand Entrance</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Soaring Ceilings</p>
         </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 right-8 md:right-24 z-30 align-right text-right">
        <div className="section-inner ml-auto">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Living Area</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Expansive & Bright</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-30 align-left">
        <div className="section-inner">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Chef's Kitchen</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">State-of-the-Art</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 right-8 md:right-24 z-30 align-right text-right">
        <div className="section-inner ml-auto">
            <p className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase text-zinc-300 drop-shadow-lg mb-4">Entertainment</p>
            <p className="font-serif text-4xl md:text-7xl font-light text-white drop-shadow-2xl">Private Lounge</p>
        </div>
      </div>
    ),
    (
      <div className="absolute bottom-16 left-8 md:left-24 z-30 align-left">
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
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
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
    <div className="bg-[#111] w-full min-h-screen font-sans selection:bg-white/20">
      
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

      <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-[#111]">
        
        {frameCounts.map((_, i) => (
          <canvas
            key={`canvas-${i}`}
            ref={el => canvasRefs.current[i] = el}
            className="absolute inset-0 w-full h-full block origin-center will-change-transform"
            style={{ 
              opacity: 1, 
              zIndex: totalVideos - i
            }}
          />
        ))}

        {/* Elegant Gradient for Typography */}
        <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-40 pointer-events-none mix-blend-multiply" />

        {/* Text Containers */}
        {textOverlays.map((content, i) => (
          <div
            key={i}
            ref={el => textRefs.current[i] = el}
            className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end will-change-transform"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            {content}
          </div>
        ))}
        
      </div>
    </div>
  );
}
