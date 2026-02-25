import { useCallback, useEffect, useMemo, useState } from 'react'

export const usePageLoading = (expectedSignals = 1, delayMs = 2000) => {
  void expectedSignals
  const [delayFinished, setDelayFinished] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDelayFinished(true)
    }, delayMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [delayMs])

  const markReady = useCallback((key: string) => {
    void key
    // Kept for backward compatibility with existing pages.
  }, [])

  const isLoading = useMemo(() => !delayFinished, [delayFinished])

  return {
    isLoading,
    markReady,
  }
}
