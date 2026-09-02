import { NextResponse } from "next/server";
import { cachedReport } from "@/app/api/orchestrator/cron/route";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  if (!cachedReport) {
    return NextResponse.json(
      { status: "NO_RUN", message: "No orchestration has run yet. Trigger /api/orchestrator to run." },
      { status: 200 }
    );
  }
  return NextResponse.json(cachedReport, { status: 200 });
}
