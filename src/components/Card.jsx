import React from 'react'

const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default Card

















