// Avatares decorativos: color e iniciales derivados del nombre.
// El color se calcula con un hash del nombre, asi cada cliente conserva
// SU color en toda la app (lista, pedido, dashboard, historial), en vez
// de depender de la posicion en la lista.

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function avatarClass(name) {
  let hash = 0
  for (let i = 0; i < (name?.length ?? 0); i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return `av av-${Math.abs(hash) % 5}`
}
