import { NextResponse } from 'next/server';

const throttleMap = {
  "None": 0,
  "Fast 3G": 150,
  "Slow 3G": 400,
  "Edge": 1000
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support legacy (baseUrl + endpoints) OR new (scenarioSteps)
    const { 
      baseUrl,
      endpoints,
      scenarioSteps = [], 
      dataPool = [],
      auth = { type: 'None', token: '' },
      networkThrottle = 'None',
      isChaosMode = false,
      vus = 10, 
      duration = 10,
      thinkTime = 0,
      timeout = 5000,
      expectedStatus = 200
    } = body;

    // Convert legacy endpoints to scenario step for backward compatibility
    let steps = scenarioSteps;
    if (steps.length === 0 && baseUrl && endpoints && endpoints.length > 0) {
      steps = [{
        method: endpoints[0].method,
        url: `${baseUrl}${endpoints[0].path}`,
        payload: endpoints[0].testCases?.[0]?.payload ? JSON.stringify(endpoints[0].testCases[0].payload) : '',
        headers: '{\n  "Content-Type": "application/json"\n}'
      }];
    }

    if (steps.length === 0) {
      return NextResponse.json({ error: "Missing scenario steps" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeChunk = (data: any) => {
      writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    const substitute = (str: string, row: any) => {
      if (!str || !row) return str;
      let res = str;
      for (const [key, val] of Object.entries(row)) {
        res = res.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      }
      return res;
    };

    const safeVus = Math.min(vus, 100);
    const safeDuration = Math.min(duration, 60);

    const startTime = Date.now();
    const endTime = startTime + (safeDuration * 1000);

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let currentRps = 0;
    let currentLatencies: number[] = [];
    const allLatencies: number[] = [];
    const statusCodes: Record<string, number> = {};

    // Interval to emit live stats every second
    const statsInterval = setInterval(() => {
      currentLatencies.sort((a,b) => a - b);
      const avg = currentLatencies.length > 0 ? Math.round(currentLatencies.reduce((a,b)=>a+b,0)/currentLatencies.length) : 0;
      
      writeChunk({
        type: 'tick',
        data: {
          rps: currentRps,
          avgLatency: avg,
          totalRequests,
          successfulRequests,
          failedRequests
        }
      });

      currentRps = 0;
      currentLatencies = [];
    }, 1000);

    const throttleDelay = throttleMap[networkThrottle as keyof typeof throttleMap] || 0;

    const worker = async () => {
      const context: Record<string, any> = {};

      while (Date.now() < endTime) {
        for (const step of steps) {
          if (Date.now() >= endTime) break;

          const dataRow = { ...((dataPool.length > 0 ? dataPool[Math.floor(Math.random() * dataPool.length)] : {})), ...context };
          
          const targetUrl = substitute(step.url, dataRow);
          let targetPayload = substitute(step.payload, dataRow);
          const protocol = (step.protocol || "HTTP").toUpperCase();
          const method = protocol === "GRAPHQL" ? "POST" : (step.method || 'GET').toUpperCase();
          
          if (protocol === "GRAPHQL") {
             try {
                // Ensure payload is a valid GraphQL JSON if it's just a raw query
                if (!targetPayload.trim().startsWith('{') && !targetPayload.trim().startsWith('[')) {
                   targetPayload = JSON.stringify({ query: targetPayload });
                }
             } catch(e) {}
          }

          const headers: Record<string, string> = {};
          
          if (auth.type === 'Bearer Token' && auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
          } else if (auth.type === 'Basic Auth' && auth.token) {
             headers['Authorization'] = `Basic ${auth.token}`;
          } else if (auth.type === 'SSO') {
             // Mock generating an SSO session with TOTP
             if (auth.totpSecret) {
                headers['X-Auth-OTP'] = Math.floor(100000 + Math.random() * 900000).toString();
                headers['X-Client-Id'] = auth.ssoClientId || 'mock-sso-client';
             }
             headers['Authorization'] = `Bearer mock-sso-token-${Date.now()}`;
          }

          try {
             if (step.headers) {
                 const parsed = JSON.parse(substitute(step.headers, dataRow));
                 Object.assign(headers, parsed);
             }
          } catch(e) {}

          const reqStartTime = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            if (isChaosMode && Math.random() < 0.05) {
               throw new Error("Chaos Drop");
            }
            if (isChaosMode) {
               await new Promise(r => setTimeout(r, Math.random() * 200));
            }
            if (throttleDelay > 0) {
               await new Promise(r => setTimeout(r, throttleDelay));
            }

            if (protocol === "WEBSOCKET") {
               const wsUrl = targetUrl.replace('http://', 'ws://').replace('https://', 'wss://');
               await new Promise((resolve, reject) => {
                  import('ws').then((wsModule) => {
                     const WebSocket = wsModule.default || wsModule;
                     const ws = new WebSocket(wsUrl);
                     ws.on('open', () => {
                        if (targetPayload) ws.send(targetPayload);
                        setTimeout(() => { ws.close(); resolve(true); }, 500);
                     });
                     ws.on('error', (err: any) => reject(err));
                     ws.on('message', (msg: any) => {
                        if (step.extractVarName && step.extractJsonPath) {
                           try {
                              const json = JSON.parse(msg.toString());
                              const val = step.extractJsonPath.split('.').reduce((acc: any, part: string) => acc && acc[part], json);
                              if (val) context[step.extractVarName] = val;
                           } catch(e) {}
                        }
                     });
                  });
               });
               statusCodes[101] = (statusCodes[101] || 0) + 1;
               successfulRequests++;
            } else {
              const res = await fetch(targetUrl, {
                method,
                headers,
                body: ['GET', 'HEAD'].includes(method) || !targetPayload ? undefined : targetPayload,
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              const text = await res.text();
              
              if (throttleDelay > 0) {
                 await new Promise(r => setTimeout(r, throttleDelay));
              }

              if (step.extractVarName && step.extractJsonPath) {
                 try {
                    const json = JSON.parse(text);
                    const val = step.extractJsonPath.split('.').reduce((acc: any, part: string) => acc && acc[part], json);
                    if (val) context[step.extractVarName] = val;
                 } catch(e) {}
              }
              
              statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
              if (res.status === expectedStatus || (!expectedStatus && res.ok)) {
                successfulRequests++;
              } else {
                failedRequests++;
              }
            }
          } catch (e: any) {
            clearTimeout(timeoutId);
            failedRequests++;
            const errType = e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR';
            statusCodes[errType] = (statusCodes[errType] || 0) + 1;
          }

          const latency = Date.now() - reqStartTime;
          currentLatencies.push(latency);
          allLatencies.push(latency);
          totalRequests++;
          currentRps++;

          if (thinkTime > 0) {
            await new Promise(resolve => setTimeout(resolve, thinkTime));
          }
        }
      }
    };

    const workers = Array.from({ length: safeVus }, () => worker());
    
    Promise.all(workers).then(() => {
       clearInterval(statsInterval);
       
       allLatencies.sort((a,b) => a-b);
       const actualDurationSec = (Date.now() - startTime) / 1000;
       const avgLatency = allLatencies.length > 0 ? Math.round(allLatencies.reduce((a,b)=>a+b,0)/allLatencies.length) : 0;

       writeChunk({
         type: 'done',
         data: {
          totalRequests,
          successfulRequests,
          failedRequests,
          avgLatencyMs: avgLatency,
          minLatencyMs: allLatencies[0] || 0,
          maxLatencyMs: allLatencies[allLatencies.length-1] || 0,
          p95LatencyMs: allLatencies[Math.floor(allLatencies.length * 0.95)] || 0,
          p99LatencyMs: allLatencies[Math.floor(allLatencies.length * 0.99)] || 0,
          requestsPerSecond: actualDurationSec > 0 ? Math.round(totalRequests / actualDurationSec) : 0,
          successRate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : "0.0",
          durationSec: actualDurationSec.toFixed(1),
          statusCodes
         }
       });
       writer.close();
    }).catch((err) => {
       clearInterval(statsInterval);
       writeChunk({ type: 'error', data: err.message });
       writer.close();
    });

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
