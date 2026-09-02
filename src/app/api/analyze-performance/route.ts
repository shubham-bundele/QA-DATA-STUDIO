import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { results, scenarioSteps, config } = await req.json();

    if (!results) {
      return NextResponse.json({ error: "No results provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `You are an expert Performance and Reliability Engineer.
I have just completed an API load test. Please diagnose the health of my system based on these results.

Test Configuration:
- Virtual Users (Concurrency): ${config.vus}
- Duration: ${config.duration} seconds
- Total Scenarios Steps: ${scenarioSteps.length}

Load Test Results:
- Total Requests: ${results.totalRequests}
- Success Rate: ${results.successRate}
- Failed Requests: ${results.failedRequests}
- Throughput: ${results.requestsPerSecond} req/s
- Min Latency: ${results.minLatencyMs} ms
- Avg Latency: ${results.avgLatencyMs} ms
- P95 Latency: ${results.p95LatencyMs} ms
- P99 Latency: ${results.p99LatencyMs} ms
- Max Latency: ${results.maxLatencyMs} ms

HTTP Status Codes Breakdown:
${JSON.stringify(results.statusCodes, null, 2)}

Please provide a concise, highly professional health diagnosis in Markdown. 
Include:
1. **Executive Summary**: A brief verdict (e.g., Healthy, Struggling, Critical).
2. **Bottleneck Analysis**: Interpret the percentiles (e.g., if P99 is huge compared to Avg, explain why).
3. **Error Analysis**: If there are errors (5xx, timeouts), deduce potential causes.
4. **Actionable Recommendations**: 2-3 specific backend optimization suggestions.
Do not wrap your response in markdown code blocks, just write plain markdown.`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
          try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Performance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


