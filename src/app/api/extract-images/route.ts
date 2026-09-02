import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => {
        // Construct absolute URL for src
        let absoluteSrc = img.src;
        try {
           absoluteSrc = new URL(img.getAttribute('src') || '', document.baseURI).href;
        } catch(e) {}

        return {
          src: absoluteSrc,
          alt: img.getAttribute('alt'),
          width: img.width,
          height: img.height,
          isVisible: img.offsetWidth > 0 && img.offsetHeight > 0
        };
      }).filter(img => img.src && img.isVisible);
    });

    await browser.close();

    // Deduplicate by src
    const uniqueImages = [];
    const seen = new Set();
    for (const img of images) {
       if (!seen.has(img.src)) {
          seen.add(img.src);
          uniqueImages.push(img);
       }
    }

    return NextResponse.json({ images: uniqueImages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

