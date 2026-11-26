import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

/** The yellow oval "About Us" sticker. */
export function AboutBadge({ className = '', id, ...props }: HTMLMotionProps<'div'> & { id?: string }) {
  return (
    <motion.div className={`badge ${className}`} {...props}>
      <h2 id={id}>About Us</h2>
    </motion.div>
  )
}
