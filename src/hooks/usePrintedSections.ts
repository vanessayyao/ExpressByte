import { useCallback, useEffect, useState } from 'react'
import { ITEMS } from '../sections'

/**
 * Tracks which sections the visitor has reached. Once reached, a section
 * stays "printed" on the receipt.
 */
export function usePrintedSections() {
  const [printed, setPrinted] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    // A section counts as reached once its top passes 60% down the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const reached = entries
          .filter((e) => e.isIntersecting || e.boundingClientRect.top < 0)
          .map((e) => e.target.id)
        if (reached.length === 0) return
        setPrinted((prev) => {
          if (reached.every((id) => prev.has(id))) return prev
          const next = new Set(prev)
          reached.forEach((id) => next.add(id))
          return next
        })
      },
      { rootMargin: '0px 0px -40% 0px' },
    )

    ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  /** Print a section's line without scrolling to it (e.g. from a pop-up). */
  const markPrinted = useCallback((id: string) => {
    setPrinted((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  return { printed, markPrinted }
}
