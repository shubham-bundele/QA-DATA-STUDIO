import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { baseUrl, path, method, payload, customHeaders = {} } = await req.json();

    if (!baseUrl || !path || !method) {
      return NextResponse.json({ error: 'Missing required parameters (baseUrl, path, method)' }, { status: 400 });
    }

    // Clean up URL to ensure no double slashes between base and path
    const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl).toString();

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...customHeaders
      },
    };

    // Only attach body for methods that allow it
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && payload) {
      fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    const startTime = performance.now();
    
    // Execute the actual API request
    const response = await fetch(url, fetchOptions);
    
    const endTime = performance.now();
    
    // Parse response data safely
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return NextResponse.json({
      success: true,
      result: {
        status: response.status,
        statusText: response.statusText,
        timeMs: Math.round(endTime - startTime),
        data: responseData,
      }
    });
  } catch (error: unknown) {
    console.error('Error executing API test:', error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: 'Test Execution Failed: ' + msg,
        result: {
          status: 0,
          statusText: 'Network/Proxy Error',
          data: msg,
          timeMs: 0
        }
      },
      { status: 500 }
    );
  }
}

