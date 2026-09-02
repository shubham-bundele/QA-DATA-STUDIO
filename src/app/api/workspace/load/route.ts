import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'workspace.qadata.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'No workspace file found. Save a workspace first.' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error loading workspace:', error);
    return NextResponse.json({ error: error.message || 'Failed to load workspace' }, { status: 500 });
  }
}

