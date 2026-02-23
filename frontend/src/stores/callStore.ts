import { create } from 'zustand'

export interface CallEvent {
  id: string
  type: string
  channel: string
  timestamp: string
  data: Record<string, unknown>
}

interface CallState {
  events: CallEvent[]
  addEvent: (event: CallEvent) => void
  clearEvents: () => void
}

export const useCallStore = create<CallState>((set) => ({
  events: [],

  addEvent: (event: CallEvent) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  clearEvents: () => set({ events: [] }),
}))
