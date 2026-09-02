import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { project, runLoadTest, runSecurityScan } = await req.json();

    // In a real app, this would spawn a background worker (like BullMQ or Celery)
    // to run the saved project configurations.
    console.log(`Received CI/CD webhook for project: ${project}`);
    console.log(`Running Load Test: ${runLoadTest}`);
    console.log(`Running Security Scan: ${runSecurityScan}`);

    return NextResponse.json({ 
       success: true, 
       message: "Tests queued successfully", 
       jobId: crypto.randomUUID() 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

