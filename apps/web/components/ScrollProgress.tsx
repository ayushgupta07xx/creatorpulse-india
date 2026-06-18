"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// Thin gradient progress bar pinned to the top, tracking whole-page scroll.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-violet via-teal to-pink"
    />
  );
}
