import React from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

/**
 * Uniform Accept/Reject trip actions for all driver dashboards
 */
const TripResponseActions = ({ onAccept, onReject, size = 'md', className = '' }) => {
  const isSm = size === 'sm'
  const btnClass = isSm
    ? 'px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5'
    : 'px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2'
  const iconSize = isSm ? 16 : 18

  return (
    <div className={className}>
      <p className={`font-semibold text-slate-700 dark:text-slate-300 mb-3 ${isSm ? 'text-sm' : ''}`}>
        Accept or reject this trip
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAccept}
          className={`${btnClass} bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all`}
        >
          <ThumbsUp size={iconSize} /> Accept
        </button>
        <button
          type="button"
          onClick={onReject}
          className={`${btnClass} bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg transition-all`}
        >
          <ThumbsDown size={iconSize} /> Reject
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Rejecting requires a reason</p>
    </div>
  )
}

export default TripResponseActions
