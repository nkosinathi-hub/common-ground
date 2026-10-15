const AFTERNOON_FROM = 12
const EVENING_FROM = 18

export function greetingFor(hour: number): string {
  if (hour < AFTERNOON_FROM) return "Good morning"
  if (hour < EVENING_FROM) return "Good afternoon"
  return "Good evening"
}
