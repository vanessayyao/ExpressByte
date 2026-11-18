import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AboutBadge, NoodleCard } from './AboutSection'
import { HowBadge, NoodleBrick, NoodleFrame } from './HowItWorksSection'
import { useMediaQuery } from '../hooks/useMediaQuery'

/*
 * The pop-up is a folded scrapbook card. Timeline (seconds):
 *   0.0  backdrop dims
 *   0.1  folded card drops in and settles, slightly tilted
 *   0.75 right half swings open on its hinge (bottom half on phones)
 *   1.5  the badge gets slapped on like a sticker
 * Closing runs roughly in reverse: fold shut, then drop away.
 */
const T = {
  drop: 0.1,
  unfold: 0.75,
  badge: 1.5,
}

const EASE_FOLD = [0.65, 0, 0.3, 1] as const

/**
 * Pop-up versions of each section, laid out like the original wide mockups:
 * `left` sits on the fixed half of the card, `right` on the half that unfolds.
 * Add an entry here when a new section gets its own pop-up.
 */
const POPUPS: Record<string, { titleId: string; left: ReactNode; right: ReactNode }> = {
  about: {
    titleId: 'popup-about-title',
    left: (
      <AboutBadge
        id="popup-about-title"
        className="popup-badge"
        initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: -8 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: T.badge }}
      />
    ),
    right: <NoodleCard className="popup-noodles" />,
  },
  'how-it-works': {
    titleId: 'popup-how-title',
    left: (
      <NoodleBrick className="popup-brick">
        <HowBadge
          id="popup-how-title"
          initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: T.badge }}
        />
      </NoodleBrick>
    ),
    right: <NoodleFrame className="popup-frame" />,
  },
}

type SectionPopupProps = {
  section: string | null
  onClose: () => void
}

export default function SectionPopup({ section, onClose }: SectionPopupProps) {
  const popup = section ? POPUPS[section] : undefined
  const closeRef = useRef<HTMLButtonElement>(null)
  // Wide screens unfold sideways; on phones the halves stack and unfold downward.
  const narrow = useMediaQuery('(max-width: 800px)')
  const folded = narrow ? { rotateX: 178 } : { rotateY: -178 }
  const open = narrow ? { rotateX: 0 } : { rotateY: 0 }
  // While folded, the closed card sits left of the panel's centre (the hinge
  // is at 44.2%). Shift the panel so the closed card starts centred, then
  // slide back as it unfolds.
  const foldedShift = narrow ? '0%' : '33.7%'
  const slide = { duration: 0.9, ease: EASE_FOLD, delay: T.unfold }

  useEffect(() => {
    if (!popup) return
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
  }, [popup, onClose])

  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          key={section}
          className="popup-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.55 } }}
        >
          <motion.div
            className="popup-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={popup.titleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, x: foldedShift, y: 90, scale: 0.7, rotate: -7 }}
            animate={{
              opacity: 1,
              x: '0%',
              y: 0,
              scale: 1,
              rotate: -1,
              transition: {
                default: { type: 'spring', stiffness: 120, damping: 15, delay: T.drop },
                x: slide,
              },
            }}
            exit={{
              opacity: 0,
              x: foldedShift,
              y: 70,
              scale: 0.85,
              rotate: -5,
              transition: {
                default: { duration: 0.35, ease: 'easeIn', delay: 0.45 },
                x: { duration: 0.5, ease: EASE_FOLD },
              },
            }}
          >
            {/* Fixed half of the card */}
            <div className="popup-leaf popup-leaf-left">
              {popup.left}
            </div>

            {/* Half that swings open on its hinge */}
            <motion.div
              className="popup-leaf popup-leaf-right"
              initial={folded}
              animate={{ ...open, transition: { duration: 0.9, ease: EASE_FOLD, delay: T.unfold } }}
              exit={{ ...folded, transition: { duration: 0.5, ease: EASE_FOLD } }}
            >
              <div className="leaf-face leaf-front">
                {popup.right}
              </div>
              <div className="leaf-face leaf-back" aria-hidden="true" />
            </motion.div>

            <motion.button
              ref={closeRef}
              type="button"
              className="popup-close"
              onClick={onClose}
              aria-label="Close"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: T.unfold + 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              ×
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
