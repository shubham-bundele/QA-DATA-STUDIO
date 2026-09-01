import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function POST(req: Request) {
  try {
    const { url, type } = await req.json();
    if (!url || !type) return NextResponse.json({ error: "Missing url or type" }, { status: 400 });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Use CDP to emulate vision deficiency (since it's not a standard Playwright page method in older versions)
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setEmulatedVisionDeficiency', { type });
    
    // Add a slight delay to ensure paints finish
    await page.waitForTimeout(500);

    const screenshot = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: false });
    await browser.close();

    return NextResponse.json({ 
       image: `data:image/jpeg;base64,${screenshot.toString('base64')}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
