import React from 'react'
import type { ThemeBackgroundEffect } from '@/styles/themes'

type StarfieldConfig = Extract<ThemeBackgroundEffect, { type: 'starfield' }>

interface StarfieldBackgroundProps {
  config: StarfieldConfig
}

const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ config }) => {
  const { baseColor, starColor, glowColor = 'rgba(255,255,255,0.25)', density = 0.3 } = config
  const spacing = Math.max(120, Math.round(220 / density))
  const offset = spacing / 2

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: baseColor, opacity: 0.92 }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${starColor} 1px, transparent 1px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `0px 0px, ${offset}px ${offset}px`,
          opacity: 0.6
        }}
      />
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          background: `radial-gradient(circle at 20% 25%, ${glowColor} 0%, transparent 45%),
          radial-gradient(circle at 80% 10%, ${glowColor} 0%, transparent 40%),
          radial-gradient(circle at 60% 70%, ${glowColor} 0%, transparent 50%)`,
          opacity: 0.8,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  )
}

export default StarfieldBackground
