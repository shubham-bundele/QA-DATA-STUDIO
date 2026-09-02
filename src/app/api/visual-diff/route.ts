import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: Request) {
  try {
    const { baselineUrl, targetUrl } = await req.json();

    if (!baselineUrl || !targetUrl) {
      return NextResponse.json({ error: "Missing URLs" }, { status: 400 });
    }

    const browser = await chromium.launch({ headless: true });
    const page1 = await browser.newPage();
    await page1.goto(baselineUrl, { waitUntil: 'networkidle' });
    const baselineBuffer = await page1.screenshot({ fullPage: true });

    const page2 = await browser.newPage();
    await page2.goto(targetUrl, { waitUntil: 'networkidle' });
    const targetBuffer = await page2.screenshot({ fullPage: true });

    await browser.close();

    const img1 = PNG.sync.read(baselineBuffer);
    const img2 = PNG.sync.read(targetBuffer);

    // Create a blank diff image of the same size (or max size)
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);
    const diff = new PNG({ width, height });

    // Pixelmatch needs images to be identically sized, so we might need to resize or pass dimensions. 
    // For simplicity in this tool, we assume they are somewhat similar, but we pad them if not.
    // To avoid pixelmatch crashing on size mismatch, we parse them to the max dimensions.
    const parseToSize = (img: PNG, w: number, h: number) => {
       const resized = new PNG({ width: w, height: h });
       PNG.sync.write(resized); // initialize empty
       img.bitblt(resized, 0, 0, img.width, img.height, 0, 0);
       return resized;
    }
    
    const i1 = img1.width === width && img1.height === height ? img1 : parseToSize(img1, width, height);
    const i2 = img2.width === width && img2.height === height ? img2 : parseToSize(img2, width, height);

    const numDiffPixels = pixelmatch(i1.data, i2.data, diff.data, width, height, { threshold: 0.1 });
    
    const diffBuffer = PNG.sync.write(diff);
    const diffBase64 = `data:image/png;base64,${diffBuffer.toString('base64')}`;
    const baselineBase64 = `data:image/png;base64,${baselineBuffer.toString('base64')}`;
    const targetBase64 = `data:image/png;base64,${targetBuffer.toString('base64')}`;

    return NextResponse.json({ 
       success: true, 
       diffPixels: numDiffPixels, 
       diffImage: diffBase64,
       baselineImage: baselineBase64,
       targetImage: targetBase64,
       matchPercentage: 100 - (numDiffPixels / (width * height) * 100)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

