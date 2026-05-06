import { useCallback, useRef, useState } from 'react'
import { showGlobalToast } from '../lib/actionToast'

export default function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    const payload = typeof message === 'object' && message !== null
      ? { message: message.message, type: message.type || type }
      : { message, type }

    setToast(payload)
    showGlobalToast(payload.message, payload.type)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, showToast }
}
