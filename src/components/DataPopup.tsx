import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import mushroomsImg from '../assets/mushrooms.png'
import dataArt from '../assets/data-art.png'
import { IMG_W } from './Basket'

/*
 * Clicking the mushrooms in the basket plays this, in seconds:
 *   0.00  screen dims; the mushrooms lift up out of the basket
 *   0.35  a knife sweeps across, slicing both of them through the middle
 *   0.80  the halves come apart, showing the pale insides
 *   1.05  the pop-up opens out of the cut, its background the mushrooms' insides
 *   1.65  the Data & Visuals art drops onto it
 * Closing: content lifts off, the card shrinks away, screen clears.
 */
const T = {
  knife: 0.35,
  knifeDur: 0.4,
  part: 0.8,
  open: 1.05,
  content: 1.65,
}

/* ---- Geometry, in basket.png pixels ---- */

// mushrooms.png is this box of basket.png, with everything but the mushrooms removed.
const BOX = { x: 430, y: 315, w: 250, h: 190 }
// The knife cuts straight across here, through the middle of both.
const CUT_Y = 415
const CUT = ((CUT_Y - BOX.y) / BOX.h) * 100 // % down the box
// Pale flesh shows this far (as % of the box height) along each cut face.
const FACE = 3.5

type DataPopupProps = {
  open: boolean
  /** Where the basket image sits on screen when the mushrooms were clicked. */
  origin: DOMRect | null
  onClose: () => void
}

export default function DataPopup({ open, origin, onClose }: DataPopupProps) {
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

  // The card opens out of the cut, so measure it before first paint.
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
  const LIFT = 1.45
  const lift = (box?.height ?? 0) * 0.3

  // The card starts as a thin slit along the cut, then opens up.
  const card = panel && box && (() => {
    const cx = box.left + box.width / 2
    const cy = box.top + box.height / 2 + (CUT / 100 - 0.5) * box.height * LIFT - lift
    const pcx = panel.left + panel.width / 2
    const pcy = panel.top + panel.height / 2
    const r = 26
    return {
      initial: {
        x: cx - pcx,
        y: cy - pcy,
        scaleX: (box.width * LIFT) / panel.width,
        scaleY: 6 / panel.height,
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
          delay: T.open,
          duration: T.content - T.open,
          ease: [0.6, 0, 0.25, 1] as const,
          opacity: { delay: T.open, duration: 0.15 },
        },
      },
    }
  })()

  const half = (side: 'top' | 'bottom') => {
    const top = side === 'top'
    // The whole half (art + pale flesh behind it) is cut at the slice line;
    // the art is cut a little short of it so a strip of flesh shows.
    const pieceClip = top ? `inset(0 0 ${100 - CUT}% 0)` : `inset(${CUT}% 0 0 0)`
    const artClip = top ? `inset(0 0 ${100 - CUT + FACE}% 0)` : `inset(${CUT + FACE}% 0 0 0)`
    return (
      <motion.div
        key={side}
        className="mush-piece"
        style={{ clipPath: pieceClip, transformOrigin: `50% ${CUT}%` }}
        initial={{ y: 0, rotate: 0 }}
        animate={{
          y: (top ? -0.16 : 0.11) * (box?.height ?? 0),
          x: (top ? -0.04 : 0.03) * (box?.width ?? 0),
          rotate: top ? -10 : 6,
          transition: { delay: T.part, type: 'spring', stiffness: 220, damping: 14 },
        }}
      >
        <div className="mush-flesh" style={{ maskImage: `url(${mushroomsImg})`, WebkitMaskImage: `url(${mushroomsImg})` }} />
        <img src={mushroomsImg} className="mush-art" style={{ clipPath: artClip }} alt="" draggable={false} />
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mush-overlay" key="data" exit={{ transition: { duration: 0.6 } }}>
          <motion.div
            className="packet-dim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.3 } }}
          />

          {/* The mushrooms: lifted out of the basket, then sliced in two. */}
          {box && (
            <motion.div
              className="mush-flight"
              aria-hidden="true"
              style={box}
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={{
                y: -lift,
                scale: LIFT,
                opacity: [1, 1, 0],
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 16,
                  opacity: { duration: T.open + 0.3, times: [0, 0.8, 1] },
                },
              }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              {half('top')}
              {half('bottom')}

              {/* Flash along the cut, trailing the knife. */}
              <motion.span
                className="mush-slash"
                style={{ top: `${CUT}%` }}
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{
                  scaleX: 1,
                  opacity: [1, 1, 0],
                  transition: {
                    delay: T.knife + 0.08,
                    duration: T.knifeDur * 0.8,
                    ease: 'easeInOut',
                    opacity: { delay: T.knife + 0.08, duration: T.knifeDur + 0.2, times: [0, 0.7, 1] },
                  },
                }}
              />

              {/* The knife, its edge running along the cut. */}
              <motion.div
                className="mush-knife"
                style={{ top: `${CUT}%` }}
                initial={{ left: '-115%', opacity: 0 }}
                animate={{
                  left: ['-115%', '-75%', '105%'],
                  opacity: [0, 1, 1, 0],
                  transition: {
                    delay: T.knife - 0.1,
                    duration: T.knifeDur + 0.1,
                    times: [0, 0.2, 1],
                    ease: 'easeInOut',
                    opacity: { delay: T.knife - 0.1, duration: T.knifeDur + 0.25, times: [0, 0.15, 0.75, 1] },
                  },
                }}
              >
                <KnifeSvg />
              </motion.div>
            </motion.div>
          )}

          {/* The pop-up itself. */}
          <div className="packet-scroller" onClick={onClose}>
            <div
              ref={panelRef}
              className="mush-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="popup-data-title"
              onClick={(e) => e.stopPropagation()}
            >
              {card && (
                <motion.div
                  className="mush-bg"
                  aria-hidden="true"
                  initial={card.initial}
                  animate={card.animate}
                  exit={{ opacity: 0, scaleX: 0.92, scaleY: 0.92, transition: { duration: 0.3, delay: 0.15 } }}
                >
                  {/* Sliced-mushroom insides, faded back behind the content. */}
                  <MushroomInside className="mush-inside mush-inside-1" />
                  <MushroomInside className="mush-inside mush-inside-2" />
                  <MushroomInside className="mush-inside mush-inside-3" />
                  <MushroomInside className="mush-inside mush-inside-4" />
                </motion.div>
              )}

              <motion.div
                className="data-art"
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: 'spring', stiffness: 150, damping: 15, delay: T.content },
                }}
                exit={{ opacity: 0, y: 40, transition: { duration: 0.2 } }}
              >
                <img src={dataArt} className="data-art-img" alt="" />
                {/* The curved label is part of the artwork; this names the dialog. */}
                <h2 id="popup-data-title" className="visually-hidden">
                  Data &amp; Visuals
                </h2>
              </motion.div>

              <motion.button
                ref={closeRef}
                type="button"
                className="popup-close mush-close"
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

/** A chef's knife, tip pointing right; its edge is the bottom of the blade at y=44. */
export function KnifeSvg() {
  return (
    <svg viewBox="0 0 300 60" width="100%" height="100%">
      <defs>
        <linearGradient id="knife-blade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f6f8" />
          <stop offset="55%" stopColor="#c3c9d0" />
          <stop offset="100%" stopColor="#8f98a3" />
        </linearGradient>
      </defs>
      <path d="M92 16 L246 16 Q286 20 300 44 L92 44 Z" fill="url(#knife-blade)" stroke="#7d858f" strokeWidth="1" />
      <path d="M96 41 L292 41" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
      <rect x="84" y="14" width="10" height="32" rx="2" fill="#9aa2ab" />
      <rect x="0" y="18" width="86" height="26" rx="9" fill="#4a2f1f" />
      <circle cx="22" cy="31" r="2.6" fill="#d9c9a8" />
      <circle cx="44" cy="31" r="2.6" fill="#d9c9a8" />
      <circle cx="66" cy="31" r="2.6" fill="#d9c9a8" />
    </svg>
  )
}

/** A mushroom cut in half lengthways: pale flesh, brown skin, gills and stem. */
function MushroomInside({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="mush-flesh" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#fffaf1" />
          <stop offset="100%" stopColor="#eadcc3" />
        </radialGradient>
      </defs>
      {/* Cap: brown skin around pale flesh */}
      <path d="M12 100 C12 44 54 16 100 16 C146 16 188 44 188 100 C188 108 180 113 170 113 L30 113 C20 113 12 108 12 100 Z" fill="#7a5238" />
      <path d="M22 100 C22 52 60 26 100 26 C140 26 178 52 178 100 C178 104 173 106 167 106 L33 106 C27 106 22 104 22 100 Z" fill="url(#mush-flesh)" />
      {/* Gills */}
      <path d="M30 106 L170 106 L164 116 L36 116 Z" fill="#b9987a" />
      <path d="M44 107 L46 115 M60 107 L61 115 M76 107 L76 115 M124 107 L124 115 M140 107 L139 115 M156 107 L154 115" stroke="#8d6b50" strokeWidth="1.2" />
      {/* Stem */}
      <path d="M78 104 L122 104 L127 176 C127 186 118 191 100 191 C82 191 73 186 73 176 Z" fill="url(#mush-flesh)" stroke="#d6c3a2" strokeWidth="1.5" />
      <path d="M90 118 C88 140 89 160 88 180 M100 116 L100 184 M110 118 C112 140 111 160 112 180" stroke="#e2d2b6" strokeWidth="1.3" fill="none" />
    </svg>
  )
}
