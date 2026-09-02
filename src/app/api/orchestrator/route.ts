import { NextRequest, NextResponse } from "next/server";
import { runFullOrchestration } from "@/core/engines/ai-orchestrator";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let triggeredBy = "manual";
    try {
      const body = await req.json();
      if (typeof body?.triggeredBy === "string" && body.triggeredBy.trim()) {
        triggeredBy = body.triggeredBy.trim();
      }
    } catch {
      // ignore JSON parse error
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const report = await runFullOrchestration(triggeredBy, baseUrl);

    const httpStatus = report.overallStatus === "FAIL" || report.overallStatus === "AI_FAILED" ? 503 : 200;
    return NextResponse.json(report, { status: httpStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown orchestrator error";
    console.error("[api/orchestrator] Unhandled error:", err);
    return NextResponse.json(
      { error: "Orchestration failed", details: message },
      { status: 500 }
    );
  }
}
