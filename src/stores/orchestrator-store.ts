"use client"

/**
 * orchestrator-store.ts
 *
 * Zustand store (with localStorage persistence) for the Centralized AI QA
 * Orchestrator. Tracks the last orchestration report, the running state, and
 * whether an escalation to a human reviewer is required.
 *
 * We intentionally type `lastReport` as `any` so this store has zero coupling
 * to the OrchestratorReport interface — the API route owns that type.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

// ─── State & Action Shape ──────────────────────────────────────────────────────

interface OrchestratorState {
  /** The most-recently received orchestration report, or null if never run. */
  lastReport: any | null

  /** True while an orchestration HTTP call is in-flight. */
  isRunning: boolean

  /**
   * True when the last report's `escalationRequired` field was truthy,
   * indicating critical failures that need human review.
   */
  hasEscalation: boolean

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Store an incoming orchestration report and automatically derive the
   * `hasEscalation` flag from `report.escalationRequired`.
   */
  setReport: (report: any) => void

  /** Toggle the "in-flight" spinner state. */
  setRunning: (v: boolean) => void

  /**
   * Manually dismiss the escalation banner without changing the stored report.
   * Useful when a human has acknowledged the alert.
   */
  clearEscalation: () => void
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useOrchestratorStore = create<OrchestratorState>()(
  persist(
    (set) => ({
      // ── Initial State ───────────────────────────────────────────────────
      lastReport: null,
      isRunning: false,
      hasEscalation: false,

      // ── Actions ─────────────────────────────────────────────────────────

      setReport: (report: any) =>
        set({
          lastReport: report,
          // Automatically set escalation flag from the report payload
          hasEscalation: Boolean(report?.escalationRequired),
        }),

      setRunning: (v: boolean) => set({ isRunning: v }),

      clearEscalation: () => set({ hasEscalation: false }),
    }),
    {
      name: "orchestrator-state", // localStorage key
      // Only persist report data, not the transient `isRunning` flag
      partialize: (state) => ({
        lastReport: state.lastReport,
        hasEscalation: state.hasEscalation,
      }),
    }
  )
)
