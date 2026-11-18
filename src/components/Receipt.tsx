import { motion } from 'motion/react'
import { ITEMS } from '../sections'

const TAX_RATE = 0.05

// Fixed bar widths so the barcode looks the same on every render.
const BARS = [
  3, 1, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 1, 1, 2, 3, 1, 2, 1, 4, 1, 1, 2, 1,
  3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2,
]

const money = (n: number) => `$${n.toFixed(2)}`

// Each new piece of the receipt "feeds" out: it grows from zero height.
const printIn = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  transition: { duration: 0.7, ease: [0.3, 0.7, 0.3, 1] as const },
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`line ${className ?? ''}`}>
      <span className="line-label">{label}</span>
      <span className="leader" aria-hidden="true" />
      <span className="line-price">{value}</span>
    </div>
  )
}

type ReceiptProps = {
  /** Ids of the sections whose lines have printed. */
  printed: Set<string>
  /** Slide the paper out of the slot on first load (hero receipt only). */
  feedOnLoad?: boolean
  /** The hero receipt holds the page's <h1>; the mini copy doesn't. */
  isMain?: boolean
}

export default function Receipt({ printed, feedOnLoad = false, isMain = false }: ReceiptProps) {
  const items = ITEMS.filter((i) => printed.has(i.id))
  const complete = items.length === ITEMS.length

  const subtotal = items.reduce((sum, i) => sum + i.price, 0)
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + tax

  const Brand = isMain ? 'h1' : 'p'

  return (
    <div className="printer">
      <div className="slot" aria-hidden="true">
        <div className="slit" />
      </div>

      <div className="paper-window">
        <motion.nav
          className="paper"
          aria-label={isMain ? 'Main navigation' : 'Section navigation'}
          initial={feedOnLoad ? { y: '-100%' } : false}
          animate={{ y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 0.8, 0.3, 1], delay: 0.2 }}
        >
          <Brand className="brand">
            <a href="#home">ExpressByte</a>
          </Brand>

          <ul className="items">
            {items.map((item) => (
              <motion.li key={item.id} {...printIn} style={{ overflow: 'hidden' }}>
                <a href={`#${item.id}`} className="line item-link">
                  <span className="line-label">1 x {item.label}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="line-price">{money(item.price)}</span>
                </a>
              </motion.li>
            ))}
          </ul>

          {complete && (
            <motion.div
              {...printIn}
              transition={{ ...printIn.transition, duration: 1.1, delay: 0.5 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="totals">
                <Line label="Subtotal:" value={money(subtotal)} />
                <Line label={`Tax (${TAX_RATE * 100}%):`} value={money(tax)} />
                <Line label="Total:" value={money(total)} className="total" />
              </div>

              <p className="thanks">
                Thank you for shopping with us.
                <br />
                Enjoy Every Byte!
              </p>

              <div className="barcode" aria-hidden="true">
                {BARS.map((w, i) => (
                  <span key={i} style={{ width: w * 2, marginRight: i % 3 === 0 ? 3 : 2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.nav>
      </div>
    </div>
  )
}
