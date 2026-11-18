import { useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import Receipt from './components/Receipt'
import Basket from './components/Basket'
import AboutSection from './components/AboutSection'
import HowItWorksSection from './components/HowItWorksSection'
import SectionPopup from './components/SectionPopup'
import { usePrintedSections } from './hooks/usePrintedSections'
import './App.css'

function App() {
  const { printed, markPrinted } = usePrintedSections()
  const [popup, setPopup] = useState<string | null>(null)

  // Sections render after the browser's own jump-to-#hash, so links like
  // /#about would land at the top. Redo the jump once the page exists.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])

  // Opening a section's pop-up counts as visiting it, so its line prints.
  const openPopup = useCallback(
    (section: string) => {
      setPopup(section)
      markPrinted(section)
    },
    [markPrinted],
  )
  const closePopup = useCallback(() => setPopup(null), [])

  return (
    // Visitors who ask their OS for reduced motion get instant transitions.
    <MotionConfig reducedMotion="user">
      <div className="layout">
        {/* The receipt stays pinned on the left while the sections scroll past. */}
        <aside className="receipt-rail">
          <Receipt printed={printed} feedOnLoad isMain />
        </aside>

        <main className="content">
          <section id="home" className="home">
            <Basket onOpen={openPopup} />
          </section>

          <AboutSection />
          <HowItWorksSection />
        </main>

        <SectionPopup section={popup} onClose={closePopup} />
      </div>
    </MotionConfig>
  )
}

export default App
