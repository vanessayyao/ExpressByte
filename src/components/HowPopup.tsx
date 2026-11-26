import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Easing } from 'motion/react'
import onionImg from '../assets/onion.png'
import { IMG_W } from './Basket'
import { KnifeSvg } from './DataPopup'
import { HowBadge, NoodleBrick, NoodleFrame } from './HowItWorksSection'

/*
 * Clicking the green onion in the basket plays this, in seconds:
 *   0.00  screen dims; the whole onion pops up out of the basket
 *   0.40  the knife chops across its tips three times (0.40, 0.75, 1.10);
 *         each chop knocks a piece off that bursts into little onion rings
 *   1.55  the rings fly out and scatter themselves across where the card will be
 *   1.80  the card fades in underneath them
 *   2.15  the rings settle and fade back into the card's background
 *   2.35  the How it Works art drops onto it
 * Closing: content lifts off, the card fades away, screen clears.
 */
const T = {
  chops: [0.4, 0.75, 1.1],
  chopDur: 0.24,
  gather: 1.55,
  gatherDur: 0.5,
  open: 1.8,
  settle: 2.15,
  content: 2.35,
}

/* ---- Geometry, in basket.png pixels ---- */

// onion.png is this box of basket.png: the whole onion, with everything else
// removed (and the bit of stalk hidden behind a mushroom filled in).
const BOX = { x: 270, y: 0, w: 260, h: 510 }
// The knife cuts straight across here, working down from the tips.
const CUTS = [50, 85, 120]
const pctY = (y: number) => ((y - BOX.y) / BOX.h) * 100
const LIFT = 1.2

/* ---- The onion bits: fixed pseudo-random spread so it looks the same each time ---- */
let seed = 7
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const PER_CUT = 14
const COLS = 7
const ROWS = 6
const BITS = CUTS.flatMap((_, cut) =>
  Array.from({ length: PER_CUT }, (_, j) => {
    const n = cut * PER_CUT + j
    return {
      cut,
      // Where along the cut it starts (basket px), and how it flies.
      x: 300 + rand() * 160,
      // Mostly sideways and a little up, then they fall (the onion's tips are
      // near the top of the screen, so there isn't much room above).
      angle: -Math.PI / 2 + (rand() < 0.5 ? -1 : 1) * (0.6 + rand() * 0.9),
      speed: 45 + rand() * 70,
      fall: 60 + rand() * 70,
      size: 9 + rand() * 9,
      spin: (rand() - 0.5) * 540,
      shade: rand(),
      // Where it settles on the card (% of the card), on a loose grid so
      // the bits cover it evenly.
      tx: ((((n * 3) % COLS) + 0.5 + (rand() - 0.5) * 0.8) / COLS) * 100,
      ty: ((Math.floor(n / COLS) % ROWS + 0.5 + (rand() - 0.5) * 0.8) / ROWS) * 100,
    }
  }),
)
const SETTLED = 1.5 // bits grow a little as they land on the card

const bitColours = (shade: number) =>
  ({
    // Lighter and darker greens, like real sliced scallion.
    '--ring': shade > 0.5 ? '#5f9a35' : '#7cb548',
    '--core': shade > 0.7 ? '#e8f3c9' : '#cfe6a2',
  }) as CSSProperties

type HowPopupProps = {
  open: boolean
  /** Where the basket image sits on screen when the onion was clicked. */
  origin: DOMRect | null
  onClose: () => void
}

export default function HowPopup({ open, origin, onClose }: HowPopupProps) {
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

  // The bits land on the card, so measure it before first paint.
  useLayoutEffect(() => {
    setPanel(open && panelRef.current ? panelRef.current.getBoundingClientRect() : null)
  }, [open])

  const k = origin ? origin.width / IMG_W : 1
  const box = origin && {
    left: origin.left + BOX.x * k,
    top: origin.top + BOX.y * k,
    width: BOX.w * k,
    height: BOX.h * k,
  }
  const lift = (box?.height ?? 0) * 0.03
  // Screen point of a basket.png spot, after the onion has popped up
  // (it grows downward from its top edge, so the tips stay on screen).
  const screen = (x: number, y: number) => {
    if (!box) return { x: 0, y: 0 }
    const cx = box.left + box.width / 2
    const cy = box.top
    const sx = (origin?.left ?? 0) + x * k
    const sy = (origin?.top ?? 0) + y * k
    return { x: cx + (sx - cx) * LIFT, y: cy + (sy - cy) * LIFT - lift }
  }

  // Each piece of leaf between two cuts, as a clipped band of the onion image.
  const bands = CUTS.map((cut, i) => ({
    top: i === 0 ? -10 : pctY(CUTS[i - 1]),
    bottom: pctY(cut),
    at: T.chops[i] + T.chopDur * 0.6,
  }))

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="onion-overlay" key="how" exit={{ transition: { duration: 0.6 } }}>
          <motion.div
            className="packet-dim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
          />

          {/* The whole onion, popped up out of the basket and chopped. */}
          {box && (
            <motion.div
              className="onion-flight"
              aria-hidden="true"
              style={{ ...box, transformOrigin: '50% 0%' }}
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={{
                y: -lift,
                scale: LIFT,
                opacity: [1, 1, 0],
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 14,
                  opacity: { duration: T.gather + 0.2, times: [0, 0.8, 1] },
                },
              }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              {/* What's left below the last cut. */}
              <div className="onion-piece" style={{ clipPath: `inset(${pctY(CUTS[2])}% 0 0 0)` }}>
                <img src={onionImg} alt="" draggable={false} />
              </div>

              {/* Pieces knocked off by each chop (they burst into the rings). */}
              {bands.map((b, i) => (
                <motion.div
                  key={i}
                  className="onion-piece"
                  style={{ clipPath: `inset(${b.top}% 0 ${100 - b.bottom}% 0)` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    y: '-3%',
                    scale: 0.9,
                    opacity: 0,
                    transition: { delay: b.at, duration: 0.18, ease: 'easeOut' },
                  }}
                >
                  <img src={onionImg} alt="" draggable={false} />
                </motion.div>
              ))}

              {/* The knife: one quick pass per chop. */}
              {CUTS.map((cut, i) => (
                <motion.div
                  key={i}
                  className="mush-knife onion-knife"
                  style={{ top: `${pctY(cut)}%` }}
                  initial={{ left: '-120%', opacity: 0 }}
                  animate={{
                    left: ['-120%', '-80%', '110%'],
                    opacity: [0, 1, 1, 0],
                    transition: {
                      delay: T.chops[i] - 0.06,
                      duration: T.chopDur + 0.06,
                      times: [0, 0.2, 1],
                      ease: 'easeIn',
                      opacity: { delay: T.chops[i] - 0.06, duration: T.chopDur + 0.12, times: [0, 0.15, 0.75, 1] },
                    },
                  }}
                >
                  <KnifeSvg />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Chopped bits: burst out at each cut, then fly out across the card
              and settle into its background. */}
          {box &&
            panel &&
            BITS.map((bit, i) => {
              const start = screen(bit.x, CUTS[bit.cut] - 14)
              const s = LIFT * k
              const burst = {
                x: start.x + Math.cos(bit.angle) * bit.speed * s,
                y: start.y + Math.sin(bit.angle) * bit.speed * s,
              }
              const land = { x: burst.x + Math.cos(bit.angle) * bit.speed * s * 0.35, y: burst.y + bit.fall * s }
              const target = {
                x: panel.left + (panel.width * bit.tx) / 100,
                y: panel.top + (panel.height * bit.ty) / 100,
              }
              const delay = bands[bit.cut].at
              const end = T.settle + 0.35
              const total = end - delay
              const at = (t: number) => (t - delay) / total
              const half = bit.size / 2
              return (
                <motion.span
                  key={i}
                  className="onion-bit"
                  aria-hidden="true"
                  style={{ width: bit.size, height: bit.size, ...bitColours(bit.shade) }}
                  initial={{ x: start.x - half, y: start.y - half, scale: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    x: [start.x, burst.x, land.x, land.x, target.x, target.x, target.x].map((v) => v - half),
                    y: [start.y, burst.y, land.y, land.y, target.y, target.y, target.y].map((v) => v - half),
                    scale: [0, 1, 1, 1, SETTLED, SETTLED, SETTLED],
                    opacity: [0, 1, 1, 1, 1, 1, 0],
                    rotate: [0, bit.spin * 0.6, bit.spin, bit.spin, bit.spin * 1.8, bit.spin * 1.8, bit.spin * 1.8],
                    transition: {
                      delay,
                      duration: total,
                      times: [0, at(delay + 0.22), at(delay + 0.55), at(T.gather), at(T.gather + T.gatherDur), at(T.settle), 1],
                      ease: ['easeOut', 'easeIn', 'linear', [0.3, 0, 0.2, 1], 'linear', 'easeIn'] as Easing[],
                    },
                  }}
                  exit={{ opacity: 0, transition: { duration: 0 } }}
                />
              )
            })}

          {/* The pop-up itself. */}
          <div className="packet-scroller" onClick={onClose}>
            <div
              ref={panelRef}
              className="how-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-how-title"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="how-bg"
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: T.open, duration: 0.35 } }}
                exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.15 } }}
              >
                {/* Faded whole onions lying behind everything. */}
                <img src={onionImg} className="how-bg-onion how-bg-onion-1" alt="" />
                <img src={onionImg} className="how-bg-onion how-bg-onion-2" alt="" />

                {/* The chopped bits, settled where they landed and faded back. */}
                {BITS.map((bit, i) => (
                  <motion.span
                    key={i}
                    className="onion-bit how-bg-bit"
                    style={{
                      left: `${bit.tx}%`,
                      top: `${bit.ty}%`,
                      width: bit.size * SETTLED,
                      height: bit.size * SETTLED,
                      rotate: bit.spin * 1.8,
                      ...bitColours(bit.shade),
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45, transition: { delay: T.settle, duration: 0.35 } }}
                  />
                ))}
              </motion.div>

              <motion.div
                className="how-content"
                initial={{ opacity: 0, y: -40, scale: 0.92 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 150, damping: 15, delay: T.content },
                }}
                exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
              >
                <NoodleBrick className="how-brick">
                  <HowBadge
                    id="popup-how-title"
                    initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
                    animate={{ opacity: 1, scale: 1, rotate: -3 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: T.content + 0.35 }}
                  />
                </NoodleBrick>
                <NoodleFrame className="how-frame" />
              </motion.div>

              <motion.button
                ref={closeRef}
                type="button"
                className="popup-close how-close"
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
