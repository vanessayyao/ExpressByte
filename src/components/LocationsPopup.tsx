import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Easing } from 'motion/react'
import packetImg from '../assets/packet.png'
import packetFadedImg from '../assets/packet-faded.png'
import nestImg from '../assets/noodle-nest.png'
import { IMG_H, IMG_W, PACKET_CUT, PACKET_POINTS, cutStyle, itemStyle } from './Basket'
import { RAMEN_OUTLINE } from '../basketOutlines'

/*
 * Clicking the ramen packet in the basket plays this, in seconds:
 *   0.00  screen dims; the packet pops up out of the basket, right where it is
 *   0.45  it rips open from the top, down the middle; the two flaps peel apart
 *   0.70  a round nest of dried ramen pops up out of the opening
 *   1.25  the nest swells into the pop-up, its noodles becoming the background
 *   1.90  the labelled packet and the info card drop onto the ramen
 * Closing: content lifts off, the ramen card shrinks away, screen clears.
 */
const T = {
  lift: 0.35,
  tear: 0.45,
  puck: 0.7,
  grow: 1.25,
  content: 1.9,
}

/* ---- Packet geometry, in basket.png pixels ---- */

const xs = PACKET_POINTS.filter((_, i) => i % 2 === 0)
const ys = PACKET_POINTS.filter((_, i) => i % 2 === 1)
const CX = xs.reduce((a, b) => a + b, 0) / xs.length
const CY = ys.reduce((a, b) => a + b, 0) / ys.length

// The packet leans about 21° clockwise in the basket. "Local" coordinates run
// along the packet itself: u across it, v from its top edge down.
const TILT = (21 * Math.PI) / 180
const cos = Math.cos(TILT)
const sin = Math.sin(TILT)
const toLocal = (x: number, y: number) => ({
  u: (x - CX) * cos + (y - CY) * sin,
  v: -(x - CX) * sin + (y - CY) * cos,
})
const toImg = (u: number, v: number) => ({ x: CX + u * cos - v * sin, y: CY + u * sin + v * cos })

const local = xs.map((x, i) => toLocal(x, ys[i]))
const U_MIN = Math.min(...local.map((p) => p.u))
const U_MAX = Math.max(...local.map((p) => p.u))
const V_MIN = Math.min(...local.map((p) => p.v))
const V_MAX = Math.max(...local.map((p) => p.v))
const U_MID = (U_MIN + U_MAX) / 2
const PACKET_H = V_MAX - V_MIN
const PACKET_W = U_MAX - U_MIN
// The tear runs from the top edge almost halfway down.
const V_HINGE = V_MIN + PACKET_H * 0.46

const BIG = 1500
const pct = (u: number, v: number) => {
  const { x, y } = toImg(u, v)
  return `${((x / IMG_W) * 100).toFixed(2)}% ${((y / IMG_H) * 100).toFixed(2)}%`
}
const polygon = (pts: [number, number][]) => `polygon(${pts.map(([u, v]) => pct(u, v)).join(', ')})`

// A ragged rip line, shared by both flaps so their edges match. The wobble
// is fixed (not random) so it looks the same every time; it settles to the
// centre at the bottom, where the rip stops.
const WOBBLE = [3, 14, -6, 9, -15, 4, -9, 12, -3, 8, -11, 5, -6, 2, 0]
const STEPS = [0, 0.05, 0.13, 0.2, 0.26, 0.35, 0.42, 0.5, 0.58, 0.64, 0.72, 0.8, 0.87, 0.94, 1]
const RIP_TOP = V_MIN - 40
const rip = (shift: number): [number, number][] =>
  WOBBLE.map((w, i) => [U_MID + w + shift, RIP_TOP + (V_HINGE - RIP_TOP) * STEPS[i]])

const flap = (side: 'left' | 'right', shift: number) =>
  side === 'left'
    ? polygon([[-BIG, V_MIN - BIG], [U_MID + shift, V_MIN - BIG], ...rip(shift), [-BIG, V_HINGE]])
    : polygon([[U_MID + shift, V_MIN - BIG], [BIG, V_MIN - BIG], [BIG, V_HINGE], ...rip(shift).reverse()])

// Torn plastic shows a pale edge: each flap gets a slightly wider pale
// backing, with the printed artwork clipped exactly to the rip on top.
const EDGE = 7
const OPEN_ANGLE = { left: -19, right: 16 }

const PIECES = {
  body: polygon([[-BIG, V_HINGE - 2], [BIG, V_HINGE - 2], [BIG, V_MAX + BIG], [-BIG, V_MAX + BIG]]),
  left: flap('left', 0),
  right: flap('right', 0),
  leftEdge: flap('left', EDGE),
  rightEdge: flap('right', -EDGE),
  // The dark inside of the bag, seen through the V as the flaps part.
  inside: (() => {
    const reach = (V_HINGE - RIP_TOP) * Math.tan((20 * Math.PI) / 180)
    return polygon([[U_MID, V_HINGE + 4], [U_MID - reach - 20, RIP_TOP], [U_MID + reach + 20, RIP_TOP]])
  })(),
}
// Both flaps hinge at the bottom of the rip, so the top opens into a V.
const PIVOT = pct(U_MID, V_HINGE)

const LIFT_SCALE = 1.1

type LocationsPopupProps = {
  open: boolean
  /** Where the basket image sits on screen when the packet was clicked. */
  origin: DOMRect | null
  onClose: () => void
}

export default function LocationsPopup({ open, origin, onClose }: LocationsPopupProps) {
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

  // The puck grows into the panel, so measure the panel before first paint.
  useLayoutEffect(() => {
    setPanel(open && panelRef.current ? panelRef.current.getBoundingClientRect() : null)
  }, [open])

  /* ---- Screen positions for this click ---- */
  const k = origin ? origin.width / IMG_W : 1
  const packetH = PACKET_H * k
  const lift = packetH * 0.08
  // Screen point of a packet-local spot, after the packet has popped up.
  const screen = (u: number, v: number) => {
    const { x, y } = toImg(u, v)
    const sx = (origin?.left ?? 0) + x * k
    const sy = (origin?.top ?? 0) + y * k
    const cx = (origin?.left ?? 0) + CX * k
    const cy = (origin?.top ?? 0) + CY * k
    return { x: cx + (sx - cx) * LIFT_SCALE, y: cy + (sy - cy) * LIFT_SCALE - lift }
  }

  // The nest: starts small inside the tear, pops up above the packet, hangs
  // for a beat, then swells into the pop-up while the card's ramen
  // background grows out from the same spot underneath it.
  const NEST_TIMES = [0, 0.35, 0.47, 1]
  const NEST_EASE = [[0.2, 1.4, 0.4, 1], 'linear', [0.6, 0, 0.25, 1]] as Easing[]
  const puck = panel && origin && (() => {
    const d = PACKET_W * k * 0.7
    const start = screen(U_MID, V_MIN + PACKET_H * 0.18)
    const top = screen(U_MID, V_MIN)
    const up = { x: start.x, y: top.y - d * 0.45 }
    const pcx = panel.left + panel.width / 2
    const pcy = panel.top + panel.height / 2
    const sx = (size: number) => size / panel.width
    const sy = (size: number) => size / panel.height
    const r = 22
    // The nest image itself, positioned by its top-left corner.
    const nestEnd = (panel.height / d) * 1.15
    const nest = {
      style: { width: d, height: (d * 368) / 380 },
      initial: { x: start.x - d / 2, y: start.y - d / 2, scale: 0.25, rotate: -40, opacity: 1 },
      animate: {
        x: [start.x - d / 2, up.x - d / 2, up.x - d / 2, pcx - d / 2],
        y: [start.y - d / 2, up.y - d / 2, up.y - d / 2, pcy - d / 2],
        scale: [0.25, 1, 1, nestEnd],
        rotate: [-40, 6, 0, 25],
        opacity: [1, 1, 1, 0],
        transition: { delay: T.puck, duration: T.content - T.puck, times: NEST_TIMES, ease: NEST_EASE },
      },
    }
    return {
      nest,
      initial: { x: start.x - pcx, y: start.y - pcy, scaleX: sx(d * 0.25), scaleY: sy(d * 0.25), opacity: 0 },
      animate: {
        x: [start.x - pcx, up.x - pcx, up.x - pcx, 0],
        y: [start.y - pcy, up.y - pcy, up.y - pcy, 0],
        scaleX: [sx(d * 0.25), sx(d), sx(d), 1],
        scaleY: [sy(d * 0.25), sy(d), sy(d), 1],
        borderRadius: ['50% / 50%', '50% / 50%', '50% / 50%', `${(r / panel.width) * 100}% / ${(r / panel.height) * 100}%`],
        opacity: 1,
        transition: {
          delay: T.puck,
          duration: T.content - T.puck,
          times: NEST_TIMES,
          ease: NEST_EASE,
          opacity: { delay: T.grow, duration: 0.3 },
        },
      },
    }
  })()

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="packet-overlay" key="locations" exit={{ transition: { duration: 0.6 } }}>
          <motion.div
            className="packet-dim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
          />

          {/* The packet, popped up out of the basket and torn open. */}
          {origin && (
            <motion.div
              className="packet-flight"
              aria-hidden="true"
              style={{
                left: origin.left,
                top: origin.top,
                width: origin.width,
                height: origin.height,
                transformOrigin: `${(CX / IMG_W) * 100}% ${(CY / IMG_H) * 100}%`,
              }}
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={{
                y: -lift,
                scale: LIFT_SCALE,
                opacity: [1, 1, 0],
                transition: {
                  type: 'spring',
                  stiffness: 320,
                  damping: 14,
                  opacity: { duration: T.grow + 0.35, times: [0, 0.75, 1] },
                },
              }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              <div className="packet-piece" style={{ clipPath: PIECES.body }}>
                <PacketArt />
              </div>
              <div className="packet-piece" style={{ clipPath: PIECES.inside }}>
                <div className="packet-inside" style={itemStyle(RAMEN_OUTLINE)} />
              </div>
              {(['left', 'right'] as const).map((side) => (
                <motion.div
                  key={side}
                  className="packet-piece"
                  style={{
                    clipPath: PIECES[side === 'left' ? 'leftEdge' : 'rightEdge'],
                    transformOrigin: PIVOT,
                  }}
                  initial={{ rotate: 0 }}
                  animate={{
                    rotate: OPEN_ANGLE[side],
                    transition: { delay: T.tear, type: 'spring', stiffness: 200, damping: 10 },
                  }}
                >
                  <div className="packet-torn-edge" style={itemStyle(RAMEN_OUTLINE)} />
                  <div className="packet-piece" style={{ clipPath: PIECES[side] }}>
                    <PacketArt />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* The nest of dried ramen that pops out of the packet. */}
          {puck && (
            <motion.img
              src={nestImg}
              className="loc-nest"
              alt=""
              aria-hidden="true"
              style={puck.nest.style}
              initial={puck.nest.initial}
              animate={puck.nest.animate}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            />
          )}

          {/* The pop-up itself. */}
          <div className="packet-scroller" onClick={onClose}>
            <div
              ref={panelRef}
              className="packet-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-locations-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ramen background, growing out from where the nest popped up. */}
              {puck && (
                <motion.div
                  className="loc-bg"
                  aria-hidden="true"
                  initial={puck.initial}
                  animate={puck.animate}
                  exit={{ opacity: 0, scaleX: 0.92, scaleY: 0.92, transition: { duration: 0.3, delay: 0.15 } }}
                />
              )}

              <div className="loc-content">
                <motion.div
                  className="loc-packet"
                  initial={{ opacity: 0, y: -60, rotate: -14, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 160, damping: 14, delay: T.content },
                  }}
                  exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
                >
                  <img src={packetImg} className="loc-packet-img" alt="" />
                  <h2 id="popup-locations-title" className="loc-label">
                    Locations
                  </h2>
                </motion.div>

                <motion.div
                  className="loc-info"
                  initial={{ opacity: 0, y: 50, rotate: 4, scale: 0.92 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 130, damping: 16, delay: T.content + 0.15 },
                  }}
                  exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
                >
                  <img src={packetFadedImg} className="loc-info-img" alt="" />
                  <div className="loc-card">
                    <p>Find ExpressByte near you!</p>

                    <p>
                      NOW AVAILABLE
                      <br />
                      <span aria-hidden="true">📍</span>Bibimbab Korean BBQ in Novi, Michigan
                      <br />
                      Visit our current ExpressByte location at Bibimbab Korean BBQ.
                    </p>

                    <p>(view images → carousel)</p>

                    <p>
                      COMING SOON
                      <br />
                      <span aria-hidden="true">📍</span>Berkeley, California
                      <br />
                      ExpressByte is coming soon to Berkeley.
                      <br />
                      More locations coming soon!
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.button
                ref={closeRef}
                type="button"
                className="popup-close loc-close"
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

/** The packet exactly as drawn in the basket, cut out on its own (no eggs in the way). */
function PacketArt() {
  return (
    <div className="packet-flight-clip">
      <img src={PACKET_CUT.src} style={cutStyle(PACKET_CUT.box)} alt="" draggable={false} />
    </div>
  )
}
