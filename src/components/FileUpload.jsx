import React, { useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'

/**
 * FileUpload - Prominent upload area that opens native file picker (desktop/internal storage)
 * when user clicks. Supports images and documents.
 */
const FileUpload = ({
  value,
  onChange,
  accept = 'image/*,application/pdf,.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  label = 'Upload document or image',
  hint = 'PDF, DOC, DOCX, TXT, JPG, PNG — click to browse Desktop or device storage',
  onError,
  className = ''
}) => {
  const inputRef = useRef(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) {
      onChange(null)
      e.target.value = ''
      return
    }
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      onError?.(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`)
      e.target.value = ''
      onChange(null)
      return
    }
    const maxBytes = maxSizeMB * 1024 * 1024
    if (f.size > maxBytes) {
      onError?.(`File too large. Max ${maxSizeMB}MB`)
      e.target.value = ''
      onChange(null)
      return
    }
    onChange(f)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer?.files?.[0]
    if (!f) return
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      onError?.(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`)
      return
    }
    const maxBytes = maxSizeMB * 1024 * 1024
    if (f.size > maxBytes) {
      onError?.(`File too large. Max ${maxSizeMB}MB`)
      return
    }
    onChange(f)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const clearFile = (e) => {
    e?.stopPropagation?.()
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{label}</label>
      <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-label="Choose file from device"
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:border-ucu-blue-400 dark:hover:border-ucu-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700/70 cursor-pointer transition-all group"
      >
        {value ? (
          <div className="flex items-center gap-3 p-4 w-full">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-ucu-blue-100 dark:bg-ucu-blue-900/40 flex items-center justify-center">
              <FileText size={20} className="text-ucu-blue-600 dark:text-ucu-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-slate-900 dark:text-white truncate">{value.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(value.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 transition-colors"
              aria-label="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="text-slate-400 dark:text-slate-500 group-hover:text-ucu-blue-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Click to browse files
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Desktop • Documents • Internal storage
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default FileUpload
