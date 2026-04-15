import { useEffect, useRef, useState } from 'react'
import Lightbox from './Lightbox'

export default function ImageUpload({ imageUrl, onUpload, label = 'foto' }) {
  const inputRef = useRef(null)
  const [activo, setActivo] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const procesar = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onUpload(file)
  }

  useEffect(() => {
    if (!activo) return
    const handler = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          procesar(item.getAsFile())
          break
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [activo])

  if (imageUrl) {
    return (
      <>
        <div className="relative group w-12 h-12 flex-shrink-0">
          {/* Click en la imagen abre el lightbox */}
          <img
            src={imageUrl}
            alt=""
            className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-zoom-in"
            onClick={() => setLightbox(true)}
          />

          {/* Boton "cambiar" separado — aparece en hover, no cubre la imagen */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}
            className="absolute -bottom-1 -right-1 bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity leading-tight"
          >
            cambiar
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && procesar(e.target.files[0])}
          />
        </div>

        {lightbox && <Lightbox src={imageUrl} onClose={() => setLightbox(false)} />}
      </>
    )
  }

  return (
    <div
      tabIndex={0}
      onFocus={() => setActivo(true)}
      onBlur={() => setActivo(false)}
      className={`w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors outline-none select-none cursor-pointer
        ${activo
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
      title="Haz click aqui y pega con Ctrl+V"
    >
      <span className={`text-xs leading-tight text-center pointer-events-none ${
        activo ? 'text-blue-500 font-medium' : 'text-gray-300 dark:text-gray-600'
      }`}>
        {activo ? 'Ctrl+V' : label}
      </span>
    </div>
  )
}
