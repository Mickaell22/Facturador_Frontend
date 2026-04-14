import { useRef, useState } from 'react'

export default function ImageUpload({ imageUrl, onUpload, label = 'foto' }) {
  const inputRef = useRef(null)
  const [activo, setActivo] = useState(false)

  const procesar = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onUpload(file)
  }

  const onPaste = (e) => {
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

  const onDrop = (e) => {
    e.preventDefault()
    procesar(e.dataTransfer.files[0])
    setActivo(false)
  }

  if (imageUrl) {
    return (
      <div className="relative group w-12 h-12 flex-shrink-0">
        <img
          src={imageUrl}
          alt=""
          className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer"
          onClick={() => window.open(imageUrl, '_blank')}
        />
        <label className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <span className="text-white text-xs">cambiar</span>
          <input
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
      onPaste={onPaste}
      onFocus={() => setActivo(true)}
      onBlur={() => setActivo(false)}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className={`w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors outline-none select-none
        ${activo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      title="Click para subir, o haz click aqui y pega con Ctrl+V"
    >
      <span className={`text-xs leading-tight text-center pointer-events-none ${activo ? 'text-blue-400' : 'text-gray-300'}`}>
        {activo ? 'Ctrl+V' : label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files[0] && procesar(e.target.files[0])}
      />
    </div>
  )
}
