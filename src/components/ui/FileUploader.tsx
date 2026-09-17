import { useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE_MB = 10

export function FileUploader({
  onFileSelected,
  accept = DEFAULT_ACCEPT,
  hint = 'PDF, JPG, or PNG — up to 10MB',
}: {
  onFileSelected: (file: File) => void
  accept?: string[]
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    if (!accept.includes(f.type)) {
      setError('Unsupported file type.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_SIZE_MB}MB.`)
      return
    }
    setError('')
    setFile(f)
    onFileSelected(f)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3">
        <FileText className="size-5 shrink-0 text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-800">{file.name}</p>
          <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button
          onClick={() => {
            setFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          className="rounded-md p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-neutral-300 hover:border-brand-400 hover:bg-neutral-50',
        )}
      >
        <Upload className="size-6 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-700">Click to upload or drag and drop</p>
        <p className="text-xs text-neutral-400">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  )
}
