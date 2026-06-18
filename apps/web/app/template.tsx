"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Runs on every route change — gives the multi-page site a smooth enter.
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
