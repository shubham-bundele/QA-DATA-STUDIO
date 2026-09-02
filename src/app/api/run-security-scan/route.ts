import { NextResponse } from 'next/server';

const payloads = [
  { name: "SQL Injection (Classic)", type: "SQLi", payload: "' OR '1'='1" },
  { name: "SQL Injection (Stacked)", type: "SQLi", payload: "'; DROP TABLE users; --" },
  { name: "Cross-Site Scripting (XSS)", type: "XSS", payload: "<script>alert('XSS')</script>" },
  { name: "Path Traversal", type: "LFI", payload: "../../../../etc/passwd" },
  { name: "Command Injection", type: "OS_INJECT", payload: "; cat /etc/passwd" },
];

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: GEMINI_API_KEY environment variable is missing. Please add it to your Vercel project settings.' },
        { status: 500 }
      );
    }
    const { url, method = 'GET' } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeChunk = (data: any) => {
      writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    // Run scans asynchronously
    (async () => {
      try {
        let vulnerabilitiesFound = 0;
        
        writeChunk({ type: 'info', message: `Starting security scan on ${url}...` });

        for (const attack of payloads) {
          writeChunk({ type: 'progress', message: `Testing for ${attack.name}...` });
          
          let targetUrl = url;
          let body: any = undefined;

          // Inject payload
          if (method === 'GET') {
             const separator = url.includes('?') ? '&' : '?';
             targetUrl = `${url}${separator}q=${encodeURIComponent(attack.payload)}&id=${encodeURIComponent(attack.payload)}`;
          } else {
             body = JSON.stringify({
                query: attack.payload,
                username: attack.payload,
                search: attack.payload
             });
          }

          try {
            const res = await fetch(targetUrl, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body
            });
            const text = await res.text();

            let isVulnerable = false;
            let reason = "";

            // Heuristic analysis of response
            if (res.status >= 500) {
               isVulnerable = true;
               reason = "Server crashed (500 Error). Possible unhandled SQL exception.";
            } else if (attack.type === 'SQLi' && (text.includes('syntax error') || text.includes('mysql_fetch') || text.includes('ORA-'))) {
               isVulnerable = true;
               reason = "Database error leaked in response.";
            } else if (attack.type === 'XSS' && text.includes(attack.payload) && res.headers.get('content-type')?.includes('text/html')) {
               isVulnerable = true;
               reason = "Payload reflected directly in HTML without sanitization.";
            } else if (attack.type === 'LFI' && text.includes('root:x:0:0:')) {
               isVulnerable = true;
               reason = "System files successfully read.";
            }

            if (isVulnerable) {
               vulnerabilitiesFound++;
               writeChunk({ 
                 type: 'finding', 
                 severity: 'High', 
                 attack: attack.name, 
                 details: reason 
               });
            } else {
               writeChunk({ type: 'safe', attack: attack.name });
            }

          } catch (e) {
             writeChunk({ type: 'info', message: `Network error during ${attack.name}` });
          }

          // Delay to prevent overloading target
          await new Promise(r => setTimeout(r, 1000));
        }

        writeChunk({ 
          type: 'done', 
          summary: `Scan complete. Found ${vulnerabilitiesFound} potential vulnerabilities.` 
        });

      } catch (e: any) {
        writeChunk({ type: 'error', message: e.message });
      } finally {
        writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

