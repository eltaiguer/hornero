'use client'

import { useRef, useState } from 'react'

interface Props {
  expenseId: string
  existingUrl?: string
}

export function ReceiptUploadForm({ expenseId, existingUrl }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState(existingUrl ?? '')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? 'Upload failed')
      }

      setUrl(payload.receiptUrl ?? '')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function removeReceipt() {
    setRemoving(true)
    setError('')
    try {
      const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to remove receipt')
      }
      setUrl('')
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove receipt')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void uploadFile(file)
          }
        }}
      />

      {url ? (
        <div className="relative rounded-md overflow-hidden border">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full"
          >
            <img src={url} alt="Receipt" className="max-h-64 object-cover w-full" />
          </button>
          <button
            type="button"
            onClick={() => void removeReceipt()}
            disabled={removing}
            className="absolute top-1 right-1 rounded-full bg-black/50 text-white w-6 h-6 flex items-center justify-center"
            aria-label="Remove receipt"
          >
            {removing ? '…' : '✕'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-md border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <p className="text-sm text-gray-500">📷 Add receipt photo</p>
          <p className="text-xs text-gray-400">Tap to take photo or choose file</p>
        </button>
      )}

      {uploading ? <p className="text-sm text-gray-500">Uploading...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {lightboxOpen && url ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <button
            type="button"
            className="absolute top-4 right-4 rounded-md border border-white/30 px-3 py-2 text-white"
            onClick={() => setLightboxOpen(false)}
          >
            Close
          </button>
          <img src={url} alt="Receipt full size" className="max-h-[90vh] max-w-[90vw] rounded-md" />
        </div>
      ) : null}
    </div>
  )
}
