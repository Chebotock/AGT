export function calcTotalTime(cleanSeconds: number, penalties: number[]): number {
  return cleanSeconds + penalties.reduce((sum, p) => sum + p, 0)
}

export function compareAnswers(submitted: string, correct: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim()
  return normalize(submitted) === normalize(correct)
}
