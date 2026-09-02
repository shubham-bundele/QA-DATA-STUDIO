import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@/lib/llm-client";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: NVIDIA_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "NVIDIA_API_KEY is not set." }, { status: 500 });

    // Fetch the image to buffer
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image from URL");
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        'You are an accessibility expert. Write a concise, descriptive alt text for this image. Do not include phrases like "Image of" or "Picture of". Just describe the content and function.',
        { inlineData: { data: buffer.toString('base64'), mimeType } }
      ]
    });

    return NextResponse.json({ altText: response.text?.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

