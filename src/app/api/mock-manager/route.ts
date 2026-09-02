import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import os from 'os';

const getMocksFile = () => path.join(os.tmpdir(), 'qa-data-studio-mocks.json');

export async function GET() {
  try {
    const file = getMocksFile();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json([]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const mocks = await req.json();
    const file = getMocksFile();
    fs.writeFileSync(file, JSON.stringify(mocks, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

