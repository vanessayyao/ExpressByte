import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Receipt from './components/Receipt'
import Basket from './components/Basket'
import LocationsPopup from './components/LocationsPopup'
import ContactPopup from './components/ContactPopup'
import DataPopup from './components/DataPopup'
import AboutPopup from './components/AboutPopup'
import HowPopup from './components/HowPopup'
import Loader, { SWIPE } from './components/Loader'
import './App.css'

function App() {
  // The landing screen shows first; the site appears once "Find Your Ramen!"
  // is pressed (so its own entrance animations play as the landing slides away).
  const [entered, setEntered] = useState(false)
  // No scrollbar while the incoming page is still below the screen.
  const enter = useCallback(() => {
    document.documentElement.classList.add('is-swiping')
    setEntered(true)
  }, [])
  const swiped = useCallback(() => document.documentElement.classList.remove('is-swiping'), [])

  const [popup, setPopup] = useState<string | null>(null)

  // Where the basket was on screen at the click, so the packet can fly out of it.
  const [origin, setOrigin] = useState<DOMRect | null>(null)

  const openPopup = useCallback((section: string, basketRect: DOMRect) => {
    setOrigin(basketRect)
    setPopup(section)
  }, [])
  const closePopup = useCallback(() => setPopup(null), [])

  // The receipt plays the same animations as the basket, so they start from
  // the basket. On phones it sits below the receipt, so bring it into view first.
  const homeRef = useRef<HTMLElement>(null)
  const openFromReceipt = useCallback(
    (section: string) => {
      const basket = homeRef.current?.querySelector('.basket')
      if (!basket) return
      const r = basket.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) {
        basket.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      openPopup(section, basket.getBoundingClientRect())
    },
    [openPopup],
  )

  return (
    // Visitors who ask their OS for reduced motion get instant transitions.
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{!entered && <Loader key="loader" onEnter={enter} />}</AnimatePresence>

      {entered && (
        <>
          {/* Rides up from below as the landing screen swipes away, as one move. */}
          <motion.div
            className="layout"
            initial={{ y: '100vh' }}
            animate={{ y: 0 }}
            transition={SWIPE}
            onAnimationComplete={swiped}
          >
            {/* Receipt on the left, basket on the right. */}
            <aside className="receipt-rail">
              <Receipt onOpen={openFromReceipt} />
            </aside>

            <main className="content">
              <section id="home" className="home" ref={homeRef}>
                <Basket onOpen={openPopup} away={popup} />
              </section>
            </main>
          </motion.div>

          {/* The green onion: the knife chops its tips into bits. */}
          <HowPopup open={popup === 'how-it-works'} origin={origin} onClose={closePopup} />
          {/* The ramen packet gets its own slice-it-open pop-up. */}
          <LocationsPopup open={popup === 'locations'} origin={origin} onClose={closePopup} />
          {/* The eggs: one cracks open on the carton. */}
          <ContactPopup open={popup === 'contact'} origin={origin} onClose={closePopup} />
          {/* The mushrooms: a knife slices them in half. */}
          <DataPopup open={popup === 'data'} origin={origin} onClose={closePopup} />
          {/* The ramen block: boiled in a pot, then served. */}
          <AboutPopup open={popup === 'about'} origin={origin} onClose={closePopup} />
        </>
      )}
    </MotionConfig>
  )
}

export default App
