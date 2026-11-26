import { motion } from 'motion/react'
import { ITEMS } from '../sections'

const TAX_RATE = 0.05

// Fixed bar widths so the barcode looks the same on every render.
const BARS = [
  3, 1, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 1, 1, 2, 3, 1, 2, 1, 4, 1, 1, 2, 1,
  3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2,
]

const money = (n: number) => `$${n.toFixed(2)}`

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
  /** Opens a section's pop-up, with the same animation as clicking it in the basket. */
  onOpen: (section: string) => void
}

/**
 * The full receipt: every section is listed, and clicking a line plays that
 * section's animation. It slides out of the printer slot once, on page load.
 */
export default function Receipt({ onOpen }: ReceiptProps) {
  const subtotal = ITEMS.reduce((sum, i) => sum + i.price, 0)
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const total = subtotal + tax

  return (
    <div className="printer">
      <div className="slot" aria-hidden="true">
        <div className="slit" />
      </div>

      <div className="paper-window">
        <motion.nav
          className="paper"
          aria-label="Main navigation"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 0.8, 0.3, 1], delay: 0.2 }}
        >
          <h1 className="brand">
            <a href="#home">ExpressByte</a>
          </h1>
          <p className="tagline">click below to learn more!</p>

          <ul className="items">
            {ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="line item-link"
                  aria-haspopup="dialog"
                  onClick={() => onOpen(item.id)}
                >
                  <span className="line-label">1 x {item.label}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="line-price">{money(item.price)}</span>
                </button>
              </li>
            ))}
          </ul>

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
              <span key={i} style={{ width: `${w * 0.11}em`, marginRight: `${i % 3 === 0 ? 0.16 : 0.11}em` }} />
            ))}
          </div>
        </motion.nav>
      </div>
    </div>
  )
}
