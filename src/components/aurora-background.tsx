"use client"

import { motion } from "framer-motion"

export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top vignette & Bottom fade */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-transparent to-black" />
      
      {/* Subtle shimmer line overlay */}
      {/* Using a pseudo-element or multiple box-shadows for a subtle shimmer line */}
      <div className="absolute inset-0 z-20 opacity-20 mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="absolute inset-0 blur-[90px] opacity-60">
        {/* Band 1 - Purple */}
        <motion.div
          animate={{
            x: ["0%", "10%", "-5%", "0%"],
            y: ["0%", "-10%", "5%", "0%"],
            opacity: [0.6, 0.8, 0.5, 0.6],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] bg-purple-600 rounded-[100%] mix-blend-screen"
        />

        {/* Band 2 - Teal */}
        <motion.div
          animate={{
            x: ["0%", "-10%", "10%", "0%"],
            y: ["0%", "10%", "-5%", "0%"],
            opacity: [0.5, 0.7, 0.4, 0.5],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[20%] right-[10%] w-[50%] h-[60%] bg-teal-500 rounded-[100%] mix-blend-screen"
        />

        {/* Band 3 - Deep Violet */}
        <motion.div
          animate={{
            x: ["-5%", "5%", "-10%", "-5%"],
            y: ["5%", "-5%", "10%", "5%"],
            opacity: [0.4, 0.9, 0.6, 0.4],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[10%] left-[20%] w-[70%] h-[60%] bg-violet-800 rounded-[100%] mix-blend-screen"
        />
      </div>
    </div>
  )
}

