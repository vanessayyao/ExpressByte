import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Easing } from 'motion/react'
import blockImg from '../assets/noodle-block.png'
import noodlesImg from '../assets/noodles.png'
import { AboutBadge } from './AboutSection'
import { IMG_W } from './Basket'

/*
 * Clicking the ramen block in the basket plays this, in seconds:
 *   0.00  screen dims; a steaming pot of boiling water rises into view
 *   0.30  the noodle block hops out of the basket and arcs over to the pot
 *   1.05  it drops in with a splash
 *   1.10  it simmers: bubbles, steam, the pot rattles
 *   2.40  the cooked noodles leap out of the pot...
 *   3.15  ...and land in the pop-up; the About Us badge slaps on, text appears
 * Closing: everything fades and lifts away.
 */
const T = {
  jump: 0.3,
  jumpDur: 0.8,
  splash: 1.05,
  out: 2.4,
  outDur: 0.75,
  card: 2.7,
}
const LAND = T.out + T.outDur

// noodle-block.png is this box of basket.png, with everything but the noodles removed.
const BOX = { x: 140, y: 280, w: 340, h: 400 }

type AboutPopupProps = {
  open: boolean
  /** Where the basket image sits on screen when the noodles were clicked. */
  origin: DOMRect | null
  onClose: () => void
}

export default function AboutPopup({ open, origin, onClose }: AboutPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const nestRef = useRef<HTMLDivElement>(null)
  const [nestBox, setNestBox] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.classList.add('popup-open')

    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('popup-open')
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [open, onClose])

  // The noodles fly into their spot in the card, so measure it before first paint.
  useLayoutEffect(() => {
    setNestBox(open && nestRef.current ? nestRef.current.getBoundingClientRect() : null)
  }, [open])

  /* ---- The pot: centred, a bit below the middle of the screen ---- */
  const vw = window.innerWidth
  const vh = window.innerHeight
  const potW = Math.min(vw * 0.3, vh * 0.5, 360)
  const potH = (potW * 200) / 240
  const pot = { left: vw / 2 - potW / 2, top: vh * 0.56 - potH / 2, width: potW, height: potH }
  const mouth = { x: vw / 2, y: pot.top + potH * (64 / 200) }

  // Shared entrance/exit for the pot's layers: rise in, then sink away once
  // the noodles have jumped out.
  const potMotion = {
    initial: { y: 60, opacity: 0 },
    animate: {
      y: [60, 0, 0, 50],
      opacity: [0, 1, 1, 0],
      transition: { duration: T.out + 0.7, times: [0, 0.12, 0.85, 1], ease: 'easeOut' as const },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  /* ---- The dry block: hop out of the basket, arc over, drop into the pot ---- */
  const block = origin && (() => {
    const k = origin.width / IMG_W
    const rect = { left: origin.left + BOX.x * k, top: origin.top + BOX.y * k, width: BOX.w * k, height: BOX.h * k }
    const c = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const s = (potW * 0.5) / (BOX.w * 0.85 * k)
    const above = { x: mouth.x, y: mouth.y - rect.height * s * 0.55 }
    const apex = { x: (c.x + above.x) / 2, y: Math.min(c.y, above.y) - vh * 0.18 }
    const sunk = { x: mouth.x, y: mouth.y + rect.height * s * 0.75 }
    return {
      style: rect,
      animate: {
        x: [0, 0, apex.x - c.x, above.x - c.x, sunk.x - c.x],
        y: [0, -rect.height * 0.12, apex.y - c.y, above.y - c.y, sunk.y - c.y],
        scale: [1, 1.05, (1 + s) / 2, s, s],
        rotate: [0, -8, 160, 360, 364],
        opacity: [1, 1, 1, 1, 0],
        transition: {
          delay: T.jump,
          duration: T.jumpDur,
          times: [0, 0.15, 0.5, 0.78, 1],
          ease: ['easeOut', 'easeOut', 'easeIn', 'easeIn'] as Easing[],
        },
      },
    }
  })()

  /* ---- The cooked noodles: leap out of the pot into their spot in the card ---- */
  const nest = nestBox && (() => {
    const w = nestBox.width
    const final = { x: nestBox.left + w / 2, y: nestBox.top + nestBox.height / 2 }
    const s0 = (potW * 0.55) / w
    const apex = { x: (mouth.x + final.x) / 2, y: Math.min(mouth.y, final.y) - vh * 0.22 }
    return {
      initial: { x: mouth.x - final.x, y: mouth.y - final.y, scale: s0, rotate: -30, opacity: 0 },
      animate: {
        x: [mouth.x - final.x, apex.x - final.x, 0],
        y: [mouth.y - final.y, apex.y - final.y, 0],
        scale: [s0, Math.max(s0 * 1.5, 0.45), 1],
        rotate: [-30, 15, 0],
        opacity: [0, 1, 1],
        transition: {
          delay: T.out,
          duration: T.outDur,
          times: [0, 0.45, 1],
          ease: ['easeOut', [0.5, 0, 0.3, 1.15]] as Easing[],
          opacity: { delay: T.out, duration: 0.1 },
        },
      },
    }
  })()

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="pot-overlay" key="about" exit={{ transition: { duration: 0.5 } }}>
          <motion.div
            className="packet-dim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}
          />

          {/* Back of the pot: inside wall, water, bubbles. */}
          <motion.div className="pot-layer pot-back" style={pot} aria-hidden="true" {...potMotion}>
            <PotBack />
          </motion.div>

          {/* The dry block, landing in the water. */}
          {block && (
            <motion.div
              className="pot-block"
              style={block.style}
              aria-hidden="true"
              initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
              animate={block.animate}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              <img src={blockImg} alt="" draggable={false} />
            </motion.div>
          )}

          {/* Front of the pot, so the block disappears inside it; then steam and splash. */}
          <motion.div className="pot-layer pot-front" style={pot} aria-hidden="true" {...potMotion}>
            <motion.div
              className="pot-rattle"
              animate={{
                rotate: [0, -1.6, 1.6, -1.2, 1.2, -0.8, 0.8, 0],
                transition: { delay: T.splash + 0.15, duration: 0.45, repeat: 2, repeatDelay: 0.05 },
              }}
            >
              <PotFront />
            </motion.div>
            <Splash />
            <Steam />
          </motion.div>

          {/* The pop-up itself. */}
          <div className="packet-scroller" onClick={onClose}>
            <div
              className="about-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-about-title"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="about-bg"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: T.card, duration: 0.45, ease: 'easeOut' } }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25, delay: 0.1 } }}
              />

              <AboutBadge
                id="popup-about-title"
                className="about-badge"
                initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: -8 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 16, delay: LAND + 0.05 }}
              />

              {/* Cooked noodles with the About text on their yellow disc. */}
              <div ref={nestRef} className="about-nest">
                {nest && (
                  <motion.img
                    src={noodlesImg}
                    className="about-nest-img"
                    alt=""
                    initial={nest.initial}
                    animate={nest.animate}
                    exit={{ opacity: 0, y: 30, transition: { duration: 0.2 } }}
                  />
                )}

                <motion.div
                  className="about-text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: LAND + 0.2, duration: 0.45 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <p className="lead">
                    Campus food should fit
                    <br />
                    your schedule!
                  </p>
                  <p>
                    Between classes, studying, meetings, and work, finding time to grab a meal
                    shouldn't be another thing students have to plan their day around.
                  </p>
                  <p>
                    Express Byte is building a faster, more convenient way for students to
                    access food across campus, especially when time and options are limited.
                  </p>
                  <p>
                    Built by students who experience these challenges firsthand, we're
                    rethinking how food can meet students where they already are.
                  </p>
                </motion.div>
              </div>

              <motion.button
                ref={closeRef}
                type="button"
                className="popup-close about-close"
                onClick={onClose}
                aria-label="Close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: LAND + 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                ×
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---- Pot drawings: viewBox 240 x 200; the rim is an ellipse centred at (120, 60) ---- */

/** Inside of the pot: back wall, rim, and boiling water with bubbles. */
function PotBack() {
  const bubbles = [
    { cx: 70, cy: 66, d: 0 },
    { cx: 104, cy: 70, d: 0.35 },
    { cx: 140, cy: 64, d: 0.15 },
    { cx: 172, cy: 68, d: 0.5 },
    { cx: 92, cy: 60, d: 0.65 },
    { cx: 156, cy: 74, d: 0.8 },
    { cx: 122, cy: 58, d: 0.25 },
  ]
  return (
    <svg viewBox="0 0 240 200" width="100%" height="100%">
      <defs>
        <linearGradient id="pot-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#59636d" />
          <stop offset="100%" stopColor="#8e98a2" />
        </linearGradient>
        <radialGradient id="pot-water" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f3f8f6" />
          <stop offset="100%" stopColor="#bcd3d6" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="60" rx="100" ry="22" fill="url(#pot-inside)" />
      <ellipse cx="120" cy="66" rx="90" ry="16" fill="url(#pot-water)" />
      {bubbles.map((b, i) => (
        <motion.circle
          key={i}
          cx={b.cx}
          cy={b.cy}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          initial={{ r: 0, opacity: 0 }}
          animate={{ r: [0, 4.5, 6], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.25, delay: b.d }}
        />
      ))}
      <ellipse cx="120" cy="60" rx="100" ry="22" fill="none" stroke="#aab3bb" strokeWidth="5" />
    </svg>
  )
}

/** Outside of the pot: body, front lip and handles. */
function PotFront() {
  return (
    <svg viewBox="0 0 240 200" width="100%" height="100%">
      <defs>
        <linearGradient id="pot-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7d8892" />
          <stop offset="22%" stopColor="#dfe5ea" />
          <stop offset="45%" stopColor="#aeb8c1" />
          <stop offset="80%" stopColor="#8a959f" />
          <stop offset="100%" stopColor="#c3ccd3" />
        </linearGradient>
      </defs>
      {/* Handles */}
      <rect x="0" y="72" width="30" height="13" rx="6.5" fill="#2f2a26" />
      <rect x="210" y="72" width="30" height="13" rx="6.5" fill="#2f2a26" />
      {/* Body: from the rim's front edge down to the base */}
      <path d="M20 60 A100 22 0 0 0 220 60 L212 172 Q210 190 190 190 L50 190 Q30 190 28 172 Z" fill="url(#pot-steel)" />
      {/* Front lip of the rim */}
      <path d="M20 60 A100 22 0 0 0 220 60" fill="none" stroke="#eef2f5" strokeWidth="5" strokeLinecap="round" />
      {/* A soft reflection */}
      <path d="M58 100 L60 170" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
    </svg>
  )
}

/** Drops of water thrown up when the block lands. */
function Splash() {
  const drops = [
    { x: -38, y: -46 },
    { x: -20, y: -62 },
    { x: 0, y: -70 },
    { x: 20, y: -60 },
    { x: 40, y: -44 },
    { x: -52, y: -24 },
    { x: 54, y: -26 },
  ]
  return (
    <svg className="pot-splash" viewBox="0 0 240 200" width="100%" height="100%">
      {drops.map((d, i) => (
        <motion.circle
          key={i}
          cx="120"
          cy="62"
          r="4"
          fill="#e8f3f5"
          stroke="#9fbcc2"
          strokeWidth="0.8"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, d.x, d.x * 1.3],
            y: [0, d.y, d.y + 40],
            opacity: [0, 1, 0],
          }}
          transition={{ delay: T.splash, duration: 0.55, ease: 'easeOut' }}
        />
      ))}
    </svg>
  )
}

/** Wisps of steam drifting up off the water, thicker once the noodles are in. */
function Steam() {
  const wisps = [
    { x: 80, d: 0 },
    { x: 118, d: 0.5 },
    { x: 155, d: 0.25 },
    { x: 100, d: 0.9 },
    { x: 140, d: 1.2 },
  ]
  return (
    <svg className="pot-steam" viewBox="0 0 240 200" width="100%" height="100%">
      {wisps.map((w, i) => (
        <motion.path
          key={i}
          d={`M${w.x} 50 C ${w.x - 14} 34, ${w.x + 14} 22, ${w.x} 6 C ${w.x - 12} -8, ${w.x + 10} -20, ${w.x} -34`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: [10, -30], opacity: [0, 0.65, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: w.d, ease: 'easeOut' }}
        />
      ))}
    </svg>
  )
}
