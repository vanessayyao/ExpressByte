import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import titleImg from '../assets/loader-title.png'
import bowlImg from '../assets/loader-bowl.png'

/** The swipe from the landing screen to the basket: both move up together. */
export const SWIPE = { duration: 0.9, ease: [0.7, 0, 0.25, 1] as const }

type LoaderProps = {
  /** "Find Your Ramen!" was pressed: head into the site. */
  onEnter: () => void
}

/**
 * The landing screen shown before the site: sky and rolling hills between two
 * slim red borders, the "enjoy every Byte" title, and a bowl of ramen.
 * Wrap it in <AnimatePresence> so it can slide away on exit.
 */
export default function Loader({ onEnter }: LoaderProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Keyboard users land straight on the button.
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.section
      className="loader"
      aria-label="Welcome to ExpressByte"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ y: '-100vh', transition: SWIPE }}
    >
      <div className="loader-scene">
        {/* Soft clouds drifting across the sky. */}
        <motion.span
          className="loader-cloud loader-cloud-1"
          aria-hidden="true"
          animate={{ x: ['0%', '6%', '0%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="loader-cloud loader-cloud-2"
          aria-hidden="true"
          animate={{ x: ['0%', '-5%', '0%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="loader-cloud loader-cloud-3" aria-hidden="true" />

        <Hills />

        <div className="loader-copy">
          <motion.img
            src={titleImg}
            className="loader-title"
            alt="enjoy every Byte"
            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 13, delay: 0.25 }}
          />
          <motion.button
            ref={buttonRef}
            type="button"
            className="loader-button"
            onClick={onEnter}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Find Your Ramen!
          </motion.button>
        </div>

        {/* The bowl slides in, then bobs gently. */}
        <motion.div
          className="loader-bowl"
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.4 }}
        >
          <motion.img
            src={bowlImg}
            alt="A red bowl of ramen with an egg and fish cake, noodles lifted with chopsticks"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          />
        </motion.div>
      </div>
    </motion.section>
  )
}

/** Rolling green hills with a halftone-dot texture, like the artwork. */
function Hills() {
  return (
    <svg className="loader-hills" viewBox="0 0 1600 400" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="hill-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.6" fill="#ffffff" opacity="0.28" />
        </pattern>
        <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6fb142" />
          <stop offset="100%" stopColor="#8cc65a" />
        </linearGradient>
        <linearGradient id="hill-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fd46a" />
          <stop offset="100%" stopColor="#bfe48b" />
        </linearGradient>
      </defs>
      {/* Back hills */}
      <path d="M0 170 C 220 60, 520 60, 760 175 C 960 90, 1300 70, 1600 150 L1600 400 L0 400 Z" fill="url(#hill-back)" />
      <path d="M0 170 C 220 60, 520 60, 760 175 C 960 90, 1300 70, 1600 150 L1600 400 L0 400 Z" fill="url(#hill-dots)" />
      {/* Front hills */}
      <path d="M0 260 C 300 170, 640 190, 900 290 C 1120 220, 1400 210, 1600 250 L1600 400 L0 400 Z" fill="url(#hill-front)" />
      <path d="M0 260 C 300 170, 640 190, 900 290 C 1120 220, 1400 210, 1600 250 L1600 400 L0 400 Z" fill="url(#hill-dots)" />
    </svg>
  )
}
