import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import os from 'os';

export const maxDuration = 60;

const getMocksFile = () => path.join(os.tmpdir(), 'qa-data-studio-mocks.json');

const handleMock = async (req: Request, { params }: { params: Promise<{ slug: string[] }> }) => {
  try {
    const resolvedParams = await params;
    const file = getMocksFile();
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: "No mocks defined" }, { status: 404 });
    }

    const mocks = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const requestPath = '/' + (resolvedParams.slug?.join('/') || '');
    const requestMethod = req.method.toUpperCase();

    // Find a matching mock
    const match = mocks.find((m: any) => 
      m.method === requestMethod && 
      m.path === requestPath
    );

    if (match) {
      // Simulate delay if configured
      if (match.delay > 0) {
        await new Promise(r => setTimeout(r, match.delay));
      }

      // Parse body if it's JSON
      let responseBody = match.responseBody;
      try {
         responseBody = JSON.parse(match.responseBody);
      } catch(e) {}

      return NextResponse.json(responseBody, { status: match.statusCode || 200 });
    }

    return NextResponse.json({ error: `No mock found for ${requestMethod} ${requestPath}` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = handleMock;
export const POST = handleMock;
export const PUT = handleMock;
export const DELETE = handleMock;
export const PATCH = handleMock;
