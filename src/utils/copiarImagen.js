import toast from 'react-hot-toast'

// Captura un nodo como PNG y lo entrega por el mejor canal disponible:
// 1) portapapeles (escritorio), 2) hoja de compartir (movil), 3) descarga.
// Muchos navegadores moviles no soportan clipboard.write con imagenes.
export async function copiarImagen(nodo, nombre = 'factura') {
  if (!nodo) return
  const id = toast.loading('Generando imagen…')
  try {
    // Import diferido: html2canvas pesa ~200 kB y solo se usa al copiar
    const { default: html2canvas } = await import('html2canvas')
    const bg = getComputedStyle(nodo).backgroundColor
    const canvas = await html2canvas(nodo, { scale: 2, useCORS: true, backgroundColor: bg })
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) throw new Error('canvas vacio')

    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success('Imagen copiada al portapapeles', { id })
      return
    } catch { /* sigue con el siguiente canal */ }

    const file = new File([blob], `${nombre}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      toast.dismiss(id)
      try { await navigator.share({ files: [file] }) } catch { /* usuario cancelo */ }
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Imagen descargada', { id })
  } catch {
    toast.error('No se pudo generar la imagen', { id })
  }
}
