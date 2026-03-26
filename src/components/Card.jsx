import React from 'react'

const Card = ({ children, className = '', hover = false, glass = false }) => {
  return (
    <div className={`
      p-6 rounded-2xl transition-all duration-300
      ${glass 
        ? 'glass-card shadow-glass' 
        : 'bg-white/95 dark:bg-slate-800/90 shadow-ucu border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm'
      }
      ${hover ? 'card-glow hover:border-ucu-blue-200/50 dark:hover:border-ucu-blue-500/30' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

export default Card

















