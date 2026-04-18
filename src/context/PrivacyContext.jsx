import { createContext, useCallback, useContext, useRef, useState } from 'react'

const PrivacyContext = createContext()

export function PrivacyProvider({ children }) {
  const [privado, setPrivado] = useState(true)
  const timerRef = useRef(null)

  const revelar = useCallback(() => {
    if (!privado) {
      clearTimeout(timerRef.current)
      setPrivado(true)
      return
    }
    setPrivado(false)
    timerRef.current = setTimeout(() => setPrivado(true), 7000)
  }, [privado])

  return (
    <PrivacyContext.Provider value={{ privado, revelar }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}
