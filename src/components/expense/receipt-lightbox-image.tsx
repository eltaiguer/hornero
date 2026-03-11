'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ReceiptLightboxImageProps {
  src: string
  alt?: string
  imgClassName?: string
}

export function ReceiptLightboxImage({
  src,
  alt = 'Receipt',
  imgClassName = 'rounded-md max-h-64 object-cover w-full',
}: ReceiptLightboxImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="block w-full" onClick={() => setOpen(true)}>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={1600}
          className={imgClassName}
          unoptimized
        />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <button
            type="button"
            className="absolute top-4 right-4 rounded-md border border-white/30 px-3 py-2 text-white"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <Image
            src={src}
            alt={`${alt} full size`}
            width={1600}
            height={2200}
            className="max-h-[90vh] max-w-[90vw] rounded-md w-auto h-auto"
            unoptimized
          />
        </div>
      ) : null}
    </>
  )
}
