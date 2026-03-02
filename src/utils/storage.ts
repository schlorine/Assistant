// src/utils/storage.ts
import { ref, watch, type Ref } from 'vue'

export function usePersistedRef<T>(key: string, defaultValue: T): Ref<T> {
  const saved = localStorage.getItem(key)
  const data = ref<T>(saved ? JSON.parse(saved) : defaultValue) as Ref<T>

  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data
}