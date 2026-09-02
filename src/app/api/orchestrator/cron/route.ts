import { NextRequest, NextResponse } from "next/server";
import { runFullOrchestration, OrchestratorReport } from "@/core/engines/ai-orchestrator";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * In-memory cache of the most recent orchestration report.
 * Exported so /api/orchestrator/status can read it without re-running.
 *
 * NOTE: Per-process in a multi-instance deployment. For cross-instance state
 * use a KV / Redis store.
 */
export let cachedReport: OrchestratorReport | null = null;

export async function GET(req: NextRequest) {
  // ---------------------------------------------------------------------------
  // Bearer-token authentication (skip validation when CRON_SECRET is not set)
  // ---------------------------------------------------------------------------
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized — invalid or missing CRON_SECRET bearer token." },
        { status: 401 }
      );
    }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const report = await runFullOrchestration("vercel-cron", baseUrl);

    // Persist to module-level cache for the status route
    cachedReport = report;

    return NextResponse.json(report, {
      status:
        report.overallStatus === "FAIL" || report.overallStatus === "AI_FAILED"
          ? 503
          : 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/orchestrator/cron] Unhandled error:", err);
    return NextResponse.json(
      { error: "Cron orchestration failed", details: message },
      { status: 500 }
    );
  }
}

