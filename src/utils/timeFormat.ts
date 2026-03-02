// src/utils/timeFormat.ts
export const formatMsToTime = (totalMs: number): string => {
  const totalSeconds = Math.floor(totalMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export const formatTimerDisplay = (
  timer: { isRunning: boolean; elapsed: number; startTime: number } | null | undefined, 
  currentTimestamp: number
): string => {
  if (!timer) return '00:00:00'
  const activeTime = Math.max(0, currentTimestamp - timer.startTime)
  const totalMs = timer.isRunning ? timer.elapsed + activeTime : timer.elapsed
  return formatMsToTime(totalMs)
}

export const getTodayYMD = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}