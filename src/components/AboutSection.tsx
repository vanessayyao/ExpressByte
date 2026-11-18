import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import noodlesImg from '../assets/noodles.jpg'

export function AboutBadge({ className = '', id, ...props }: HTMLMotionProps<'div'> & { id?: string }) {
  return (
    <motion.div className={`badge ${className}`} {...props}>
      <h2 id={id}>About Us</h2>
    </motion.div>
  )
}

/** The noodle nest with the About text on its yellow disc. */
type NoodleCardProps = Omit<HTMLMotionProps<'div'>, 'children'> & { children?: ReactNode }

export function NoodleCard({ className = '', children, ...props }: NoodleCardProps) {
  return (
    <motion.div className={`noodle-card ${className}`} {...props}>
      <img src={noodlesImg} className="noodle-img" alt="" />
      {children}
      <div className="noodle-text">
        <p className="lead">
          Campus food should fit
          <br />
          your schedule!
        </p>
        <p>
          Between classes, studying, meetings, and work, finding time to grab a meal
          shouldn't be another thing students have to plan their day around.
        </p>
        <p>
          Express Byte is building a faster, more convenient way for students to
          access food across campus, especially when time and options are limited.
        </p>
        <p>
          Built by students who experience these challenges firsthand, we're
          rethinking how food can meet students where they already are.
        </p>
      </div>
    </motion.div>
  )
}

export default function AboutSection() {
  return (
    <section id="about" className="page about">
      <NoodleCard
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Sticker-style badge tucked over the top-left of the noodles. */}
        <AboutBadge
          initial={{ opacity: 0, scale: 0.6, rotate: -24 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -10 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 170, damping: 13, delay: 0.35 }}
        />
      </NoodleCard>
    </section>
  )
}
