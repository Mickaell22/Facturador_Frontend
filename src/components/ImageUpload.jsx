import { useRef, useState, useEffect } from 'react'
import Lightbox from './Lightbox'

// Subida de imagen por: click (selector de archivos / camara en movil),
// arrastrar y soltar, o Ctrl+V. Con `pegarGlobal` escucha el pegado en toda
// la pagina mientras este montado (p.ej. dentro del panel de nuevo articulo),
// asi no hace falta enfocar la caja antes de pegar.
// `onUpload` puede devolver una promesa: mientras no resuelve se muestra "subiendo".
export default function ImageUpload({
  imageUrl, onUpload, onDelete, label = 'foto', pegarGlobal = false, size = 'w-12 h-12', texto,
}) {
  const inputRef = useRef(null)
  const [activo, setActivo] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const onUploadRef = useRef(onUpload)
  useEffect(() => { onUploadRef.current = onUpload })

  // Cuando llega imageUrl el boton enfocado deja de renderizarse sin disparar
  // onBlur; sin esto `activo` quedaria true y el listener de paste seguiria vivo.
  useEffect(() => {
    if (imageUrl) setActivo(false)
  }, [imageUrl])

  const procesar = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setSubiendo(true)
    try { await onUploadRef.current(file) } finally { setSubiendo(false) }
  }

  // Listener a nivel document para Firefox en Linux (no expone clipboardData.items
  // en elementos no editables via el evento onPaste del elemento).
  // Solo intercepta pegados con imagen: el texto sigue llegando a los inputs.
  const escuchar = pegarGlobal || activo
  useEffect(() => {
    if (!escuchar) return
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
  }, [escuchar])

  const dropProps = {
    onDragOver: (e) => { e.preventDefault(); setArrastrando(true) },
    onDragLeave: () => setArrastrando(false),
    onDrop: (e) => { e.preventDefault(); setArrastrando(false); procesar(e.dataTransfer.files?.[0]) },
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      tabIndex={-1}
      onChange={(e) => { procesar(e.target.files?.[0]); e.target.value = '' }}
    />
  )

  // En touch no hay hover: los controles quedan siempre visibles
  const revelar = 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity'

  if (imageUrl) {
    return (
      <>
        <div className={`relative group ${size} flex-shrink-0`} {...dropProps}>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label={`Ver ${label} ampliada`}
            className={`${size} block rounded-lg overflow-hidden border border-ldg-line cursor-zoom-in`}
          >
            <img src={imageUrl} alt="" width="96" height="96" loading="lazy" className={`${size} object-cover ${subiendo ? 'opacity-40' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => inputRef.current.click()}
            className={`absolute -bottom-1 -right-1 bg-ldg-ink text-ldg-on-ink text-[10px] px-1.5 py-0.5 rounded leading-tight ${revelar}`}
          >
            {subiendo ? '…' : 'cambiar'}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Quitar ${label}`}
              className={`absolute -top-1.5 -right-1.5 bg-ldg-danger text-ldg-on-ink text-xs w-5 h-5 rounded-full flex items-center justify-center leading-none ${revelar}`}
            >
              &times;
            </button>
          )}
          {fileInput}
        </div>

        {lightbox && <Lightbox src={imageUrl} onClose={() => setLightbox(false)} />}
      </>
    )
  }

  const resaltado = activo || arrastrando
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        onFocus={() => setActivo(true)}
        onBlur={() => setActivo(false)}
        disabled={subiendo}
        aria-label={`Subir ${label}: toca para elegir, arrastra o pega con Ctrl+V`}
        title="Click para elegir · arrastra · o pega con Ctrl+V"
        {...dropProps}
        className={`${size} flex-shrink-0 flex flex-col items-center justify-center gap-0.5 border-2 border-dashed rounded-lg transition-colors select-none
          ${resaltado
            ? 'border-ldg-accent bg-ldg-accent-soft text-ldg-accent'
            : 'border-ldg-line text-ldg-muted-soft hover:border-ldg-accent hover:text-ldg-accent'}`}
      >
        <span className="text-[11px] leading-tight text-center pointer-events-none px-1">
          {subiendo ? 'subiendo…' : texto ? (resaltado ? 'Ctrl+V o suelta aquí' : texto) : (activo ? 'Ctrl+V' : label)}
        </span>
      </button>
      {fileInput}
    </>
  )
}
