export const formatTimerDisplay = (timer: { isRunning: boolean; elapsed: number; startTime: number }, currentTimestamp: number) => {
  if (!timer) return '00:00:00'
  const activeTime = Math.max(0, currentTimestamp - timer.startTime)
  const totalMs = timer.isRunning ? timer.elapsed + activeTime : timer.elapsed
    
  const totalSeconds = Math.floor(totalMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}