"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// App Router template re-mounts on every navigation, so this gives a subtle
// fade + rise between routes. No-ops under reduced-motion.
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
