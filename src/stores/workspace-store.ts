import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  testCases: {
    storyInput: string;
    result: any | null;
    isAnalyzing: boolean;
    duration?: number;
    error: string;
  };
  setTestCases: (state: Partial<WorkspaceState['testCases']>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      testCases: {
        storyInput: "As a bank customer, I want to transfer money to another account so that I can pay my bills. The transfer should fail if my balance is insufficient, or if the destination account is invalid. It should succeed and deduct the amount if everything is correct.",
        result: null,
        isAnalyzing: false,
        error: "",
      },
      setTestCases: (updates) => set((state) => ({ 
        testCases: { ...state.testCases, ...updates } 
      })),
    }),
    {
      name: 'qa-studio-workspace',
      partialize: (state) => ({
        // We only persist the inputs and results. 
        // isAnalyzing shouldn't be persisted because if they refresh the page, it should reset to false.
        testCases: {
          ...state.testCases,
          isAnalyzing: false, 
        }
      })
    }
  )
)
