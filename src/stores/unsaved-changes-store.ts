"use client"

import { create } from "zustand"

interface UnsavedChangesState {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
}

export const useUnsavedChangesStore = create<UnsavedChangesState>((set) => ({
  isDirty: false,
  setDirty: (dirty) => set({ isDirty: dirty }),
}))
