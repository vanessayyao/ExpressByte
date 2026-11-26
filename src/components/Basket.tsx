import { useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import basketImg from '../assets/basket.png'
import noodlesCut from '../assets/noodle-block.png'
import packetCut from '../assets/packet-cut.png'
import onionCut from '../assets/onion.png'
import mushroomsCut from '../assets/mushrooms.png'
import eggsCut from '../assets/eggs-cut.png'
import { ITEMS } from '../sections'
import { EGGS_OUTLINE, MUSHROOMS_OUTLINE, NOODLES_OUTLINE, ONION_OUTLINE, RAMEN_OUTLINE } from '../basketOutlines'

// Size of basket.png in pixels; the outlines below are in these coordinates.
export const IMG_W = 1140
export const IMG_H = 970

/**
 * Rough four-sided outline of the ramen packet. The Locations pop-up uses it
 * to work out the packet's tilt and middle (for where it tears open).
 */
export const PACKET_POINTS = [680, 282, 1060, 430, 1000, 875, 870, 870, 600, 760, 640, 560]

/** Where a cut-out image sits in basket.png (pixels). */
export type CutBox = { x: number; y: number; w: number; h: number }

/** The ramen packet on its own (packet-cut.png) and where it sits in the basket. */
export const PACKET_CUT = { src: packetCut, box: { x: 585, y: 265, w: 490, h: 625 } }

type BasketItem = {
  id: string
  label: string
  /** Which section's pop-up this item opens (an id from sections.ts). */
  section: string
  /** The item on its own, cut out of basket.png, and where it sits in it. */
  src: string
  box: CutBox
  /** Exact outline of the item in basket.png, as x,y pixel pairs (its click area). */
  points: number[]
}

// Listed back-to-front, matching how the items overlap in the artwork.
const BASKET_ITEMS: BasketItem[] = [
  {
    id: 'noodles',
    label: 'Ramen noodles',
    section: 'about',
    src: noodlesCut,
    box: { x: 140, y: 280, w: 340, h: 400 },
    points: NOODLES_OUTLINE,
  },
  {
    id: 'ramen',
    label: 'Shin Ramyun pack',
    section: 'locations',
    src: PACKET_CUT.src,
    box: PACKET_CUT.box,
    points: RAMEN_OUTLINE,
  },
  {
    id: 'onion',
    label: 'Green onion',
    section: 'how-it-works',
    src: onionCut,
    box: { x: 270, y: 0, w: 260, h: 510 },
    points: ONION_OUTLINE,
  },
  {
    id: 'mushrooms',
    label: 'Mushrooms',
    section: 'data',
    src: mushroomsCut,
    box: { x: 430, y: 315, w: 250, h: 190 },
    points: MUSHROOMS_OUTLINE,
  },
  {
    id: 'eggs',
    label: 'Eggs',
    section: 'contact',
    src: eggsCut,
    box: { x: 390, y: 470, w: 345, h: 300 },
    points: EGGS_OUTLINE,
  },
]

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`

export function itemStyle(points: number[]): CSSProperties {
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

/** Places a cut-out image exactly where its item sits in the basket picture. */
export function cutStyle(box: CutBox): CSSProperties {
  return {
    left: pct(box.x, IMG_W),
    top: pct(box.y, IMG_H),
    width: pct(box.w, IMG_W),
    height: pct(box.h, IMG_H),
  }
}

const sectionLabel = (id: string) => ITEMS.find((i) => i.id === id)?.label ?? id

type BasketProps = {
  /**
   * Called when an item is clicked or tapped (hovering only lifts it), with
   * where the basket image sits on screen so a pop-up can animate out of it.
   */
  onOpen: (section: string, basketRect: DOMRect) => void
  /** The section whose pop-up is open: its item is out of the basket meanwhile. */
  away?: string | null
}

export default function Basket({ onOpen, away = null }: BasketProps) {
  // The item being hovered or focused, which lifts up out of the basket.
  const [lifted, setLifted] = useState<string | null>(null)
  const lift = (id: string) => () => setLifted(id)
  const drop = (id: string) => () => setLifted((cur) => (cur === id ? null : cur))

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

      {/* Where an item sat, once it's lifted out: a shadow in its exact shape
          that hides the item as painted in the basket picture. Drawn under all
          the items, so anything lying on top of that spot still shows. */}
      {BASKET_ITEMS.map((item) => (
        <span
          key={item.id}
          className={`basket-hole ${lifted === item.id || away === item.section ? 'is-open' : ''}`}
          style={{ ...cutStyle(item.box), maskImage: `url(${item.src})`, WebkitMaskImage: `url(${item.src})` }}
          aria-hidden="true"
        />
      ))}

      {BASKET_ITEMS.map((item) => (
        <div key={item.id} className={`basket-item-layer ${away === item.section ? 'is-away' : ''}`}>
          <button
            type="button"
            className="basket-item"
            style={itemStyle(item.points)}
            aria-label={`${item.label}: open ${sectionLabel(item.section)}`}
            aria-haspopup="dialog"
            onPointerEnter={lift(item.id)}
            onPointerLeave={drop(item.id)}
            onFocus={lift(item.id)}
            onBlur={drop(item.id)}
            onClick={(e) => onOpen(item.section, e.currentTarget.closest('.basket')!.getBoundingClientRect())}
          >
            {/* Just the item, so lifting it never drags bits of the basket along. */}
            <img src={item.src} className="basket-item-cut" style={cutStyle(item.box)} alt="" draggable={false} />
          </button>
        </div>
      ))}
    </motion.div>
  )
}
