import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: NVIDIA_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { url, wcagLevel = "wcag2aa" } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js' });
    
    // Determine tags based on selection. 'wcag2a' includes only A. 'wcag2aa' includes A and AA. 'wcag21aa' includes A, AA, 2.1 A, 2.1 AA.
    const tags = wcagLevel === 'wcag2a' ? ['wcag2a'] 
               : wcagLevel === 'wcag2aa' ? ['wcag2a', 'wcag2aa'] 
               : wcagLevel === 'wcag21aa' ? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
               : wcagLevel === 'wcag2aaa' ? ['wcag2a', 'wcag2aa', 'wcag2aaa']
               : ['wcag2a', 'wcag2aa']; // default

    const results = await page.evaluate(async (runTags) => {
       // @ts-ignore
       return await window.axe.run({
           runOnly: { type: 'tag', values: runTags }
       });
    }, tags);

    await browser.close();

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

