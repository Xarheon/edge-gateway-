// Xarheon Edge for Wasmer - Simple Version
export default async function handler(request, context) {
  const url = new URL(request.url);
  
  // Get target from header
  let targetHost = request.headers.get("x-host");
  
  // If no x-host, return status page
  if (!targetHost) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
    <title>Xarheon Edge on Wasmer</title>
    <meta http-equiv="refresh" content="5">
    <style>
        body {
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #fff;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: rgba(0,0,0,0.6);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid #00ffff;
        }
        h1 { color: #00ffff; }
        .status { color: #0f0; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ XARHEON EDGE</h1>
        <p>Wasmer Edge Function Active</p>
        <div class="status">● SYSTEM ONLINE</div>
        <p style="font-size: 12px; margin-top: 20px;">x-host header required for proxy</p>
    </div>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }
  
  // Build target URL
  let targetUrl;
  if (targetHost.startsWith('http://') || targetHost.startsWith('https://')) {
    targetUrl = `${targetHost}${url.pathname}${url.search}`;
  } else {
    targetUrl = `https://${targetHost}${url.pathname}${url.search}`;
  }
  
  try {
    // Clean headers
    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    headers.set("Accept", "*/*");
    
    // Forward request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null
    });
    
    // Return response
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream"
      }
    });
    
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { status: 502 });
  }
}
