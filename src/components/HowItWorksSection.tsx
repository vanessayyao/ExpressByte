import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import brickImg from '../assets/noodle-brick.jpg'
import frameImg from '../assets/noodle-frame.jpg'

/** Mint label stuck across the noodle brick. */
export function HowBadge({ className = '', id, ...props }: HTMLMotionProps<'div'> & { id?: string }) {
  return (
    <motion.div className={`how-badge ${className}`} {...props}>
      <h2 id={id}>How it Works</h2>
    </motion.div>
  )
}

type CardProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode }

/** The square noodle brick with the star; the badge goes in as a child. */
export function NoodleBrick({ className = '', children, ...props }: CardProps) {
  return (
    <motion.div className={`noodle-brick ${className}`} {...props}>
      <img src={brickImg} className="noodle-img" alt="" />
      {children}
    </motion.div>
  )
}

/** The wavy noodle frame holding the steps on a mint card. */
export function NoodleFrame({ className = '', ...props }: CardProps) {
  return (
    <motion.div className={`noodle-frame ${className}`} {...props}>
      <img src={frameImg} className="noodle-img" alt="" />
      <div className="how-card">
        <p className="lead">
          Food where you need it,
          <br />
          when you need it
        </p>
        <ol>
          <li>
            Find an ExpressByte location in your student union building, residence
            hall, library, academic building, or other high traffic campus space.
          </li>
          <li>
            Browse the ramen options currently available at that location and choose
            what works for you.
          </li>
          <li>Pick up your ramen directly from the ExpressByte location.</li>
          <li>
            Head back to class, the library, your dorm, or wherever you're going next.
          </li>
        </ol>
        <p>
          ExpressByte strives to bring convenient food options closer to the places
          students already spend their day :)
        </p>
      </div>
    </motion.div>
  )
}

export default function HowItWorksSection() {
  const rise = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
  }

  return (
    <section id="how-it-works" className="page how">
      <NoodleBrick {...rise} transition={{ duration: 0.8, ease: 'easeOut' }}>
        <HowBadge
          initial={{ opacity: 0, scale: 0.6, rotate: -14 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 170, damping: 13, delay: 0.35 }}
        />
      </NoodleBrick>
      <NoodleFrame {...rise} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} />
    </section>
  )
}
