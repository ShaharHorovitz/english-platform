"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Route transition. template.tsx remounts on every navigation, so this fades +
 * slides each page in (enter only — the App Router doesn't retain the old tree
 * for exit animations). Disabled under prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
