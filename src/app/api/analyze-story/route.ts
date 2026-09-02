import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const resultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    decomposition: {
      type: Type.OBJECT,
      properties: {
        actors: { type: Type.ARRAY, items: { type: Type.STRING } },
        actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        preconditions: { type: Type.ARRAY, items: { type: Type.STRING } },
        outcomes: { type: Type.ARRAY, items: { type: Type.STRING } },
        edgeCases: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['actors', 'actions', 'preconditions', 'outcomes', 'edgeCases']
    },
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['positive', 'negative', 'boundary', 'security'] },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          domain: { type: Type.STRING },
          generatorLink: { type: Type.STRING },
          dataFields: { type: Type.ARRAY, items: { type: Type.STRING } },
          gherkin: {
            type: Type.OBJECT,
            properties: {
              given: { type: Type.STRING },
              when: { type: Type.STRING },
              then: { type: Type.STRING }
            },
            required: ['given', 'when', 'then']
          }
        },
        required: ['id', 'title', 'category', 'priority', 'domain', 'generatorLink', 'dataFields', 'gherkin']
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        totalCases: { type: Type.INTEGER },
        byCategory: {
          type: Type.OBJECT,
          properties: {
            positive: { type: Type.INTEGER },
            negative: { type: Type.INTEGER },
            boundary: { type: Type.INTEGER },
            security: { type: Type.INTEGER }
          },
          required: ['positive', 'negative', 'boundary', 'security']
        },
        byDomain: { type: Type.OBJECT },
        byPriority: {
          type: Type.OBJECT,
          properties: {
            high: { type: Type.INTEGER },
            medium: { type: Type.INTEGER },
            low: { type: Type.INTEGER }
          },
          required: ['high', 'medium', 'low']
        }
      },
      required: ['totalCases', 'byCategory', 'byDomain', 'byPriority']
    },
    detectedDomains: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          generatorLink: { type: Type.STRING }
        },
        required: ['domain', 'confidence', 'keywords', 'generatorLink']
      }
    }
  },
  required: ['decomposition', 'testCases', 'recommendations', 'summary', 'detectedDomains']
};

export async function POST(req: Request) {
    try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { story } = await req.json();

    if (!story) {
      return NextResponse.json({ error: 'Story is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are an expert QA Automation Architect. 
      Analyze the following user story and generate structured test cases.
      Break it down into actors, actions, preconditions, outcomes, and edge cases.
      Provide realistic data fields for payload generation.
      For 'domain', select from: ['user-profile', 'banking', 'credit-card', 'address', 'api', 'security'].
      For 'generatorLink', use the corresponding route: e.g., '/generators/user-profile', '/generators/banking', etc.
      
      User Story:
      ${story}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: resultSchema,
        temperature: 0.2
      }
    });

    if (!response.text) {
        throw new Error("No response text");
    }

    const jsonResult = JSON.parse(response.text);
    
    // Add userStory to the result
    jsonResult.userStory = story;

    return NextResponse.json(jsonResult);
  } catch (error: unknown) {
    console.error('Error analyzing story:', error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: 'Failed to analyze story: ' + msg },
      { status: 500 }
    );
  }
}

