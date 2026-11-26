import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Easing } from 'motion/react'
import basketImg from '../assets/basket.png'
import contactArt from '../assets/contact-art.png'
import { IMG_H, IMG_W } from './Basket'

/*
 * Clicking the eggs in the basket plays this, in seconds:
 *   0.00  screen dims; the front egg pops up out of the carton
 *   0.30  it swings over the carton's rim and winds up
 *   0.62  it raps the rim: a crack appears, and it bounces back
 *   1.00  the crack runs the full height and the shell pulls apart
 *   1.05  the egg drops out of the shell
 *   1.45  its yolk swells into the pop-up
 *   2.05  the Contact Us art and info drop onto it
 * Closing: content lifts off, the card shrinks away, screen clears.
 */
const T = {
  split: 1.0,
  drop: 1.05,
  grow: 1.45,
  content: 2.05,
}

/* ---- Egg geometry, in basket.png pixels ---- */

// The front-right egg in the carton, fully in view.
const EGG = { cx: 575, cy: 647, rx: 46, ry: 42 }
const POP_SCALE = 1.5
// Top of the carton's right-hand wall, where the egg gets cracked.
const RIM = { x: 690, y: 560 }

const pctX = (x: number) => `${((x / IMG_W) * 100).toFixed(2)}%`
const pctY = (y: number) => `${((y / IMG_H) * 100).toFixed(2)}%`
const EGG_CLIP = `ellipse(${pctX(EGG.rx)} ${pctY(EGG.ry)} at ${pctX(EGG.cx)} ${pctY(EGG.cy)})`

// A jagged crack from the bottom of the egg (where it hits) to the top.
const CRACK_OFFSETS = [0, -6, 5, -7, 4, -5, 6, -3, 0]
const CRACK: [number, number][] = CRACK_OFFSETS.map((dx, i) => [
  EGG.cx + dx,
  EGG.cy + EGG.ry + 3 - ((2 * EGG.ry + 6) * i) / (CRACK_OFFSETS.length - 1),
])
const CRACK_PATH = `M ${CRACK.map(([x, y]) => `${x} ${y}`).join(' L ')}`

const BIG = 3000
const poly = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${pctX(x)} ${pctY(y)}`).join(', ')})`
const HALVES = {
  // CRACK runs bottom to top.
  left: poly([[-BIG, BIG], ...CRACK, [CRACK[CRACK.length - 1][0], -BIG], [-BIG, -BIG]]),
  right: poly([[BIG, BIG], ...CRACK, [CRACK[CRACK.length - 1][0], -BIG], [BIG, -BIG]]),
}
// Halves hinge at the top of the egg, so the bottom opens and the egg drops out.
const HINGE = `${pctX(EGG.cx)} ${pctY(EGG.cy - EGG.ry)}`

/* ---- Where the egg goes: (x, y) in basket.png pixels ---- */
const STOPS = {
  start: { x: EGG.cx, y: EGG.cy },
  popped: { x: EGG.cx + 15, y: EGG.cy - 165 },
  over: { x: RIM.x - 10, y: RIM.y - 110 },
  hit: { x: RIM.x, y: RIM.y - EGG.ry * POP_SCALE + 4 },
  back: { x: RIM.x - 6, y: RIM.y - 95 },
}
const HOP_TIMES = [0, 0.3, 0.55, 0.62, 0.8, 1]
const HOP_DURATION = T.split

type ContactPopupProps = {
  open: boolean
  /** Where the basket image sits on screen when the eggs were clicked. */
  origin: DOMRect | null
  onClose: () => void
}

export default function ContactPopup({ open, origin, onClose }: ContactPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<DOMRect | null>(null)

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

  // The egg grows into the panel, so measure the panel before first paint.
  useLayoutEffect(() => {
    setPanel(open && panelRef.current ? panelRef.current.getBoundingClientRect() : null)
  }, [open])

  const k = origin ? origin.width / IMG_W : 1
  const shift = (p: { x: number; y: number }) => ({ x: (p.x - EGG.cx) * k, y: (p.y - EGG.cy) * k })
  const hops = [STOPS.start, STOPS.popped, STOPS.over, STOPS.hit, STOPS.back, STOPS.back].map(shift)

  // The egg dropping out of the shell, then swelling into the pop-up.
  const blob = panel && origin && (() => {
    const eggW = EGG.rx * 2 * POP_SCALE * k
    const d = eggW * 1.7
    const bottom = {
      x: origin.left + STOPS.back.x * k,
      y: origin.top + (STOPS.back.y + EGG.ry * POP_SCALE * 0.6) * k,
    }
    const landed = { x: bottom.x - eggW * 0.15, y: bottom.y + d * 0.55 }
    const pcx = panel.left + panel.width / 2
    const pcy = panel.top + panel.height / 2
    const times = [0, 0.35, 0.4, 1]
    const ease = [[0.3, 0, 0.4, 1.3], 'linear', [0.6, 0, 0.25, 1]] as Easing[]
    const dur = T.content - T.drop
    const r = 28
    return {
      // The egg itself (an SVG of white + yolk), positioned by its top-left.
      egg: {
        style: { width: d, height: d },
        // Hidden inside the shell until it drops out.
        initial: { x: bottom.x - d / 2, y: bottom.y - d / 2, scale: 0.2, opacity: 0 },
        animate: {
          x: [bottom.x - d / 2, landed.x - d / 2, landed.x - d / 2, pcx - d / 2],
          y: [bottom.y - d / 2, landed.y - d / 2, landed.y - d / 2, pcy - d / 2],
          scale: [0.2, 1, 1, (panel.height / d) * 1.3],
          // Starts at 0: delayed keyframes jump to their first value right away.
          opacity: [0, 1, 1, 0],
          transition: {
            delay: T.drop,
            duration: dur,
            times,
            ease,
            opacity: { delay: T.drop, duration: dur, times: [0, 0.04, 0.9, 1] },
          },
        },
      },
      // The card's background, growing from the yolk.
      card: {
        initial: {
          x: landed.x - pcx,
          y: landed.y - pcy,
          scaleX: (d * 0.45) / panel.width,
          scaleY: (d * 0.45) / panel.height,
          opacity: 0,
        },
        animate: {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          borderRadius: ['50% / 50%', `${(r / panel.width) * 100}% / ${(r / panel.height) * 100}%`],
          opacity: 1,
          transition: {
            delay: T.grow,
            duration: T.content - T.grow,
            ease: [0.6, 0, 0.25, 1] as const,
            opacity: { delay: T.grow, duration: 0.25 },
          },
        },
      },
    }
  })()

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="egg-overlay" key="contact" exit={{ transition: { duration: 0.6 } }}>
          <motion.div
            className="packet-dim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
          />

          {/* The egg: pops up, raps the carton rim, cracks and splits. */}
          {origin && (
            <motion.div
              className="egg-flight"
              aria-hidden="true"
              style={{
                left: origin.left,
                top: origin.top,
                width: origin.width,
                height: origin.height,
                transformOrigin: `${pctX(EGG.cx)} ${pctY(EGG.cy)}`,
              }}
              initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
              animate={{
                x: hops.map((h) => h.x),
                y: hops.map((h) => h.y),
                scale: [1, POP_SCALE, POP_SCALE, POP_SCALE, POP_SCALE, POP_SCALE],
                rotate: [0, -10, 14, -6, 0, 0],
                opacity: [1, 1, 0],
                transition: {
                  duration: HOP_DURATION,
                  times: HOP_TIMES,
                  ease: [[0.25, 1.5, 0.5, 1], 'easeInOut', 'easeIn', 'easeOut', 'linear'] as Easing[],
                  opacity: { duration: T.grow + 0.3, times: [0, 0.8, 1] },
                },
              }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              {(['left', 'right'] as const).map((side) => (
                <motion.div
                  key={side}
                  className="egg-piece"
                  style={{ clipPath: HALVES[side], transformOrigin: HINGE }}
                  initial={{ rotate: 0, x: 0 }}
                  animate={{
                    rotate: side === 'left' ? 32 : -32,
                    x: (side === 'left' ? -8 : 8) * k,
                    transition: { delay: T.split, type: 'spring', stiffness: 180, damping: 12 },
                  }}
                >
                  <div className="egg-shell" style={{ clipPath: EGG_CLIP }}>
                    <img src={basketImg} alt="" draggable={false} />
                  </div>
                </motion.div>
              ))}

              {/* The crack, appearing where it hits the rim and running up. */}
              <svg className="egg-crack" viewBox={`0 0 ${IMG_W} ${IMG_H}`} preserveAspectRatio="none">
                <motion.path
                  d={CRACK_PATH}
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{
                    pathLength: [0, 0, 0.35, 0.35, 1],
                    opacity: [1, 1, 1, 1, 1, 0],
                    transition: {
                      duration: T.split,
                      times: [0, 0.62, 0.68, 0.85, 1],
                      opacity: { duration: T.split + 0.05, times: [0, 0.6, 0.7, 0.9, 0.98, 1] },
                    },
                  }}
                />
              </svg>
            </motion.div>
          )}

          {/* The egg that drops out of the shell. */}
          {blob && (
            <motion.div
              className="egg-blob"
              aria-hidden="true"
              style={blob.egg.style}
              initial={blob.egg.initial}
              animate={blob.egg.animate}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              <EggSvg />
            </motion.div>
          )}

          {/* The pop-up itself. */}
          <div className="packet-scroller" onClick={onClose}>
            <div
              ref={panelRef}
              className="egg-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-contact-title"
              onClick={(e) => e.stopPropagation()}
            >
              {blob && (
                <motion.div
                  className="egg-bg"
                  aria-hidden="true"
                  initial={blob.card.initial}
                  animate={blob.card.animate}
                  exit={{ opacity: 0, scaleX: 0.92, scaleY: 0.92, transition: { duration: 0.3, delay: 0.15 } }}
                />
              )}

              <motion.div
                className="contact-art"
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 150, damping: 15, delay: T.content },
                }}
                exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
              >
                <img src={contactArt} className="contact-art-img" alt="" />

                <h2 id="popup-contact-title" className="contact-label">
                  Contact Us
                </h2>

                <p className="contact-bubble contact-bubble-1">
                  Let's build a better campus food experience together!
                </p>
                <p className="contact-bubble contact-bubble-2">
                  Have a question, partnership idea, or location suggestion? We'd love to hear
                  from you!
                </p>

                <ul className="contact-links">
                  <li>
                    <InstagramIcon />
                    <span>
                      <span className="visually-hidden">Instagram: </span>ExpressByte
                    </span>
                  </li>
                  <li>
                    <LinkedInIcon />
                    <span>
                      <span className="visually-hidden">LinkedIn: </span>ExpressByte
                    </span>
                  </li>
                  <li>
                    <MailIcon />
                    <span>
                      <span className="visually-hidden">Email: </span>[ExpressByte email]
                    </span>
                  </li>
                </ul>
              </motion.div>

              <motion.button
                ref={closeRef}
                type="button"
                className="popup-close egg-close"
                onClick={onClose}
                aria-label="Close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: T.content + 0.4 } }}
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

/** A raw egg: wobbly white with a glossy yolk. */
function EggSvg() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id="egg-yolk" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#ffe58a" />
          <stop offset="55%" stopColor="#fbbf2c" />
          <stop offset="100%" stopColor="#ee9a12" />
        </radialGradient>
        <radialGradient id="egg-white" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f6efdf" />
        </radialGradient>
      </defs>
      <path
        d="M50 6 C66 5 80 13 88 26 C96 39 95 52 91 64 C86 79 73 92 55 94 C38 96 21 90 12 76 C4 64 5 47 10 34 C16 19 33 7 50 6 Z"
        fill="url(#egg-white)"
        stroke="#e7dcc4"
        strokeWidth="1"
      />
      <circle cx="49" cy="50" r="22" fill="url(#egg-yolk)" />
      <ellipse cx="42" cy="42" rx="7" ry="4.5" fill="#fff6cf" opacity="0.8" transform="rotate(-30 42 42)" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="35%" stopColor="#fa7e1e" />
          <stop offset="65%" stopColor="#d62976" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.3" cy="7.7" r="1" fill="#fff" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="#0a66c2" />
      <rect x="5" y="9.5" width="3" height="9" fill="#fff" />
      <circle cx="6.5" cy="6.3" r="1.8" fill="#fff" />
      <path d="M10.5 9.5h2.9v1.3c.5-.9 1.6-1.5 3-1.5 2.4 0 3.1 1.5 3.1 3.8v5.4h-3v-4.8c0-1.1-.3-1.9-1.3-1.9-1.1 0-1.7.8-1.7 2v4.7h-3z" fill="#fff" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#111" />
      <rect x="5.5" y="7.5" width="13" height="9" rx="1" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M5.8 8l6.2 5 6.2-5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
