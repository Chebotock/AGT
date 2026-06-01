import { create } from 'zustand'

interface GameState {
  teamName: string | null
  currentProblem: number | null
  setTeam: (name: string) => void
  setCurrentProblem: (n: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  teamName: null,
  currentProblem: null,
  setTeam: (name) => set({ teamName: name }),
  setCurrentProblem: (n) => set({ currentProblem: n }),
}))
