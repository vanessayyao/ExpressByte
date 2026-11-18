import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import basketImg from '../assets/basket.jpg'
import { ITEMS } from '../sections'

// Size of basket.jpg in pixels; the outlines below are in these coordinates.
const IMG_W = 1140
const IMG_H = 970

type BasketItem = {
  id: string
  label: string
  /** Which section's pop-up this item opens (an id from sections.ts). */
  section: string
  /** Outline of the item in the image, as x,y pixel pairs. */
  points: number[]
}

// Listed back-to-front, matching how the items overlap in the artwork.
const BASKET_ITEMS: BasketItem[] = [
  {
    id: 'noodles',
    label: 'Ramen noodles',
    section: 'about',
    points: [148, 315, 390, 285, 440, 330, 468, 590, 440, 650, 225, 675, 195, 620, 160, 420],
  },
  {
    id: 'ramen',
    label: 'Shin Ramyun pack',
    section: 'about',
    points: [680, 282, 1060, 430, 1000, 875, 870, 870, 600, 760, 640, 560],
  },
  {
    id: 'onion',
    label: 'Green onion',
    section: 'how-it-works',
    points: [290, 95, 320, 30, 400, 10, 440, 15, 470, 40, 465, 300, 520, 490, 470, 505, 430, 470, 410, 300],
  },
  {
    id: 'mushrooms',
    label: 'Mushrooms',
    section: 'about',
    points: [437, 370, 480, 325, 560, 320, 600, 365, 660, 370, 672, 420, 640, 460, 600, 455, 590, 495, 550, 500, 545, 450, 520, 420, 500, 470, 470, 470, 450, 410],
  },
  {
    id: 'eggs',
    label: 'Eggs',
    section: 'about',
    points: [440, 520, 500, 500, 690, 540, 700, 600, 660, 730, 420, 700, 400, 650],
  },
]

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`

function itemStyle(points: number[]): CSSProperties {
  const xs = points.filter((_, i) => i % 2 === 0)
  const ys = points.filter((_, i) => i % 2 === 1)
  const pairs = xs.map((x, i) => `${pct(x, IMG_W)} ${pct(ys[i], IMG_H)}`)
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length
  return {
    clipPath: `polygon(${pairs.join(', ')})`,
    transformOrigin: `${pct(cx, IMG_W)} ${pct(cy, IMG_H)}`,
  }
}

const sectionLabel = (id: string) => ITEMS.find((i) => i.id === id)?.label ?? id

type BasketProps = {
  /** Called when an item is clicked or tapped. Hovering only lifts the item. */
  onOpen: (section: string) => void
}

export default function Basket({ onOpen }: BasketProps) {
  return (
    <motion.div
      className="basket"
      initial={{ opacity: 0, y: 40, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
    >
      <img
        src={basketImg}
        className="basket-img"
        alt="A shopping basket holding ramen noodles, green onions, mushrooms, eggs and a pack of Shin Ramyun"
      />

      {BASKET_ITEMS.map((item) => (
        <div key={item.id} className="basket-item-layer">
          <button
            type="button"
            className="basket-item"
            style={itemStyle(item.points)}
            aria-label={`${item.label}: open ${sectionLabel(item.section)}`}
            aria-haspopup="dialog"
            onClick={() => onOpen(item.section)}
          >
            <img src={basketImg} alt="" draggable={false} />
          </button>
        </div>
      ))}
    </motion.div>
  )
}
