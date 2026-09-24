import { useEffect, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => readJson(key, initialValue))
  useEffect(() => {
    writeJson(key, value)
  }, [key, value])
  return [value, setValue]
}
