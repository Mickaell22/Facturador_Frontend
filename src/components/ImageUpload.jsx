import { useEffect, useRef, useState } from 'react'

export default function ImageUpload({ imageUrl, onUpload, label = 'foto' }) {
  const inputRef = useRef(null)
  const [activo, setActivo] = useState(false)

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
      <div className="relative group w-12 h-12 flex-shrink-0">
        <img
          src={imageUrl}
          alt=""
          className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => window.open(imageUrl, '_blank')}
        />
        <label className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <span className="text-white text-xs">cambiar</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && procesar(e.target.files[0])}
          />
        </label>
      </div>
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
