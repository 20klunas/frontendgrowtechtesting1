"use client";

import { motion } from "framer-motion";

export default function SectionReveal({ children, className = "" }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.h2>
  );
}