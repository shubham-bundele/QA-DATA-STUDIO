import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const data = await req.json();
    const filePath = path.join(process.cwd(), 'workspace.qadata.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Workspace saved successfully to workspace.qadata.json' });
  } catch (error: any) {
    console.error('Error saving workspace:', error);
    return NextResponse.json({ error: error.message || 'Failed to save workspace' }, { status: 500 });
  }
}

