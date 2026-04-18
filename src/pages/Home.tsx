import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'

// Generated once — stable across renders
const speedLines = Array.from({ length: 28 }).map((_, i) => ({
  top: `${(i / 28) * 100}%`,
  width: `${Math.random() * 45 + 15}%`,
  isRed: i % 6 === 0,
  opacity: Math.random() * 0.35 + 0.08,
}))

const TICKER = [
  'SEASON 2026', '24 RACES', '10 TEAMS', '20 DRIVERS',
  'BAHRAIN GP', 'SAUDI GP', 'AUSTRALIAN GP', 'JAPANESE GP',
  'MIAMI GP', 'MONACO GP', 'BRITISH GP', 'ITALIAN GP',
]

const STATS = [
  { value: '2026', label: 'Season' },
  { value: '24',   label: 'Races'  },
  { value: '10',   label: 'Teams'  },
  { value: '20',   label: 'Drivers'},
]

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef      = useRef<HTMLDivElement>(null)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const cursorRef    = useRef<HTMLDivElement>(null)
  const dotRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ── Fonts ──────────────────────────────────────
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
    document.head.appendChild(link)

    // ── Custom cursor ──────────────────────────────
    const onMove = (e: MouseEvent) => {
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' })
      gsap.to(dotRef.current,    { x: e.clientX, y: e.clientY, duration: 0.08 })
    }
    window.addEventListener('mousemove', onMove)

    const allLinks = document.querySelectorAll('a, button')
    allLinks.forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(cursorRef.current, { scale: 2.2, duration: 0.3 }))
      el.addEventListener('mouseleave', () => gsap.to(cursorRef.current, { scale: 1,   duration: 0.3 }))
    })

    // ── GSAP animations ────────────────────────────
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 })

      // 1. Speed lines shoot in from left
      tl.from('.speed-line', {
        x: '-110%',
        duration: 1.4,
        stagger: 0.035,
        ease: 'expo.out',
      })

      // 2. Glowing red rule
      .from(lineRef.current, {
        scaleX: 0,
        duration: 0.7,
        ease: 'power4.inOut',
        transformOrigin: 'left center',
      }, '-=0.6')

      // 3. Letters drop + flip in
      .from('.t-letter', {
        y: 130,
        rotateX: -80,
        opacity: 0,
        duration: 0.75,
        stagger: 0.04,
        ease: 'back.out(1.8)',
      }, '-=0.4')

      // 4. Badge + subtitle
      .from('.hero-sub', {
        y: 18,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power3.out',
      }, '-=0.35')

      // 5. CTA buttons slide up
      .from('.cta-btn', {
        y: 28,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power3.out',
      }, '-=0.3')

      // 6. Stats strip
      .from('.stat-col', {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.08,
      }, '-=0.4')

      // Looping: scroll bounce
      gsap.to(scrollRef.current, {
        y: 10, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2.2,
      })

      // Looping: speed lines breathe
      gsap.to('.speed-line', {
        opacity: 0.04,
        duration: 2.5,
        stagger: { each: 0.25, repeat: -1, yoyo: true },
        ease: 'sine.inOut',
      })

    }, containerRef)

    return () => {
      ctx.revert()
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <>
      {/* ── Cursor ───────────────────────────────── */}
      <div ref={cursorRef} style={{
        position: 'fixed', top: 0, left: 0, width: 36, height: 36,
        border: '1px solid rgba(220,38,38,0.7)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
      }} />
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 5, height: 5,
        background: '#dc2626', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)',
      }} />

      {/* ── Page ─────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative min-h-screen bg-[#070707] flex flex-col overflow-hidden"
        style={{ cursor: 'none' }}
      >

        {/* Noise grain */}
        <svg style={{
          position:'absolute', inset:0, width:'100%', height:'100%',
          opacity: 0.045, pointerEvents:'none', zIndex:10,
        }}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)"/>
        </svg>

        {/* Red radial glow */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
          background:'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(220,38,38,0.13) 0%, transparent 68%)',
        }} />

        {/* Corner vignette */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
          background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }} />

        {/* Speed lines */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:2 }}>
          {speedLines.map((ln, i) => (
            <div key={i} className="speed-line" style={{
              position: 'absolute',
              top: ln.top,
              left: 0,
              width: ln.width,
              height: ln.isRed ? '2px' : '1px',
              opacity: ln.opacity,
              background: ln.isRed
                ? 'linear-gradient(90deg, transparent, rgba(220,38,38,0.9) 30%, rgba(220,38,38,0.4) 100%)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.1) 100%)',
              boxShadow: ln.isRed ? '0 0 12px rgba(220,38,38,0.5)' : 'none',
            }} />
          ))}
        </div>

        {/* ── HERO ─────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col items-center justify-center pt-24 pb-8 px-6"
          style={{ zIndex: 20 }}>

          {/* Live badge */}
          <div className="hero-sub flex items-center gap-2.5 mb-7">
            <span style={{
              width:7, height:7, borderRadius:'50%', background:'#dc2626',
              boxShadow:'0 0 10px rgba(220,38,38,0.9)',
              animation:'pulse 2s infinite',
            }} />
            <span style={{
              fontFamily:"'Space Mono', monospace",
              fontSize:'0.6rem', letterSpacing:'0.4em',
              color:'rgba(220,38,38,0.75)', textTransform:'uppercase',
            }}>
              Formula 1 · Season 2026 · Live
            </span>
          </div>

          {/* Giant title */}
          <h1 style={{
            fontFamily:"'Bebas Neue', sans-serif",
            fontSize:'clamp(5.5rem, 17vw, 18rem)',
            lineHeight: 0.88,
            letterSpacing:'-0.02em',
            textAlign:'center',
            perspective:'500px',
            marginBottom: 0,
          }}>
            {/* RED — solid white */}
            <span style={{ display:'inline-block', overflow:'hidden' }}>
              {'RED'.split('').map((l, i) => (
                <span key={i} className="t-letter" style={{
                  display:'inline-block', color:'#ffffff',
                }}>{l}</span>
              ))}
            </span>
            {/* LINE — red outline, glowing */}
            <span style={{ display:'inline-block', overflow:'hidden' }}>
              {'LINE'.split('').map((l, i) => (
                <span key={i} className="t-letter" style={{
                  display:'inline-block',
                  color:'transparent',
                  WebkitTextStroke:'2.5px #dc2626',
                  textShadow:'0 0 60px rgba(220,38,38,0.45)',
                }}>{l}</span>
              ))}
            </span>
          </h1>

          {/* Red rule */}
          <div ref={lineRef} style={{
            width:120, height:1, margin:'2rem auto',
            background:'linear-gradient(90deg, transparent, #dc2626 40%, transparent)',
            boxShadow:'0 0 24px rgba(220,38,38,0.7)',
          }} />

          {/* Subtitle */}
          <p className="hero-sub" style={{
            fontFamily:"'Space Mono', monospace",
            fontSize:'0.65rem', letterSpacing:'0.55em',
            color:'rgba(255,255,255,0.22)', textTransform:'uppercase',
            marginBottom:'2.5rem',
          }}>
            The Ultimate F1 Fan Hub
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <Link to="/teams" className="cta-btn" style={{
              position:'relative', overflow:'hidden',
              padding:'0.85rem 2.2rem',
              border:'1px solid rgba(220,38,38,0.85)',
              textDecoration:'none', display:'block',
            }}
              onMouseEnter={e => {
                const bg = (e.currentTarget as HTMLElement).querySelector('.btn-bg') as HTMLElement
                if (bg) gsap.to(bg, { x: '0%', duration: 0.35, ease: 'power2.out' })
                gsap.to(e.currentTarget.querySelector('.btn-label'), { color:'#000', duration: 0.35 })
              }}
              onMouseLeave={e => {
                const bg = (e.currentTarget as HTMLElement).querySelector('.btn-bg') as HTMLElement
                if (bg) gsap.to(bg, { x: '-101%', duration: 0.3, ease: 'power2.in' })
                gsap.to(e.currentTarget.querySelector('.btn-label'), { color:'#fff', duration: 0.3 })
              }}
            >
              <div className="btn-bg" style={{
                position:'absolute', inset:0, background:'#dc2626',
                transform:'translateX(-101%)',
              }} />
              <span className="btn-label" style={{
                position:'relative', zIndex:1,
                fontFamily:"'Space Mono', monospace",
                fontSize:'0.62rem', letterSpacing:'0.3em',
                color:'#fff', textTransform:'uppercase', fontWeight:700,
              }}>Explore Teams</span>
            </Link>

            <Link to="/drivers" className="cta-btn" style={{
              padding:'0.85rem 2.2rem',
              border:'1px solid rgba(255,255,255,0.08)',
              textDecoration:'none',
            }}
              onMouseEnter={e => gsap.to(e.currentTarget, { borderColor:'rgba(255,255,255,0.35)', duration:0.3 })}
              onMouseLeave={e => gsap.to(e.currentTarget, { borderColor:'rgba(255,255,255,0.08)', duration:0.3 })}
            >
              <span style={{
                fontFamily:"'Space Mono', monospace",
                fontSize:'0.62rem', letterSpacing:'0.3em',
                color:'rgba(255,255,255,0.35)', textTransform:'uppercase', fontWeight:700,
              }}>View Drivers</span>
            </Link>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────── */}
        <div style={{
          position:'relative', zIndex:20,
          borderTop:'1px solid rgba(255,255,255,0.04)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1.2rem 3.5rem',
        }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-col" style={{ textAlign:'center' }}>
              <div style={{
                fontFamily:"'Bebas Neue', sans-serif",
                fontSize:'2rem', color:'#fff', lineHeight:1,
              }}>{s.value}</div>
              <div style={{
                fontFamily:"'Space Mono', monospace",
                fontSize:'0.55rem', letterSpacing:'0.35em',
                color:'rgba(255,255,255,0.18)', textTransform:'uppercase', marginTop:4,
              }}>{s.label}</div>
            </div>
          ))}

          {/* Scroll indicator */}
          <div ref={scrollRef} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <span style={{
              fontFamily:"'Space Mono', monospace",
              fontSize:'0.5rem', letterSpacing:'0.4em',
              color:'rgba(255,255,255,0.15)', textTransform:'uppercase',
            }}>Scroll</span>
            <div style={{
              width:1, height:26,
              background:'linear-gradient(180deg, #dc2626 0%, transparent 100%)',
              boxShadow:'0 0 8px rgba(220,38,38,0.5)',
            }} />
          </div>
        </div>

        {/* ── Ticker tape ──────────────────────────── */}
        <div style={{
          position:'relative', zIndex:20,
          borderTop:'1px solid rgba(255,255,255,0.04)',
          background:'#0d0d0d',
          padding:'0.55rem 0',
          overflow:'hidden',
        }}>
          <div className="animate-ticker" style={{ display:'flex', whiteSpace:'nowrap' }}>
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} style={{
                fontFamily:"'Space Mono', monospace",
                fontSize:'0.58rem', letterSpacing:'0.35em',
                textTransform:'uppercase',
                padding:'0 2.5rem',
                color: i % 3 === 1 ? 'rgba(220,38,38,0.6)' : 'rgba(255,255,255,0.15)',
              }}>
                {item}
                <span style={{ marginLeft:'2.5rem', color:'rgba(220,38,38,0.25)' }}>·</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}