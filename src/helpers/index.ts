import { DateTime } from 'luxon'

export function formatter(lang: string, options: Intl.DateTimeFormatOptions, date: Date) {
    return Intl.DateTimeFormat(lang, options).format(date)
}

export function getTimeFromString(date: string) {
    const tIndex = date.indexOf('T')
    return (tIndex !== -1) ? date.slice(tIndex + 1, tIndex + 6) : ''
}

export function getCurrentDateInZone(timeZone: string) {
  return DateTime.now().setZone(timeZone);
}

function getMinutesFromString(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function getTopPercent(current: DateTime, start: string, end: string, cellHeight: number, stepMinutes = 30) {
  const currentTime = current.hour * 60 + current.minute

  let startTime = getMinutesFromString(start)
  let endTime = getMinutesFromString(end)

  let adjustedCurrentTime = currentTime
  let adjustedEndTime = endTime

  if (endTime <= startTime) {
    adjustedEndTime += 1440
    if (currentTime < startTime) {
      adjustedCurrentTime += 1440
    }
  }

  const totalMinutes = adjustedEndTime - startTime
  const totalPixels = (totalMinutes / stepMinutes) * (cellHeight * 2)

  const clampedTime = Math.min(Math.max(adjustedCurrentTime, startTime), adjustedEndTime)
  const pixelsFromStart = ((clampedTime - startTime) / stepMinutes) * (cellHeight * 2)
  const percent = (pixelsFromStart / totalPixels) * 100

  return percent
}

export function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}
