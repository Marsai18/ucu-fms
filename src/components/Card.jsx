import React from 'react'

const Card = ({ children, className = '', hover = false, glass = false }) => {
  return (
    <div
      className={`
      p-6 sm:p-7 rounded-2xl transition-all duration-300
      ${glass
        ? 'glass-card shadow-glass'
        : 'bg-white/95 dark:bg-slate-800/92 border border-slate-200/85 dark:border-slate-600/70 backdrop-blur-sm shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-8px_rgba(0,0,0,0.45)]'
      }
      ${hover ? 'card-glow hover:border-ucu-blue-200/60 dark:hover:border-ucu-blue-500/35' : ''}
      ${className}
    `}
    >
      {children}
    </div>
  )
}

export default Card

















