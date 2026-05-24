// edge.js - دقیقاً مثل کد Netlify
const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate",
  "proxy-authorization", "te", "trailer", "transfer-encoding",
  "upgrade", "forwarded", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port",
]);

export default async function handler(request, context) {
  try {
    const url = new URL(request.url);
    
    let targetHost = request.headers.get("x-host");
    
    if (!targetHost) {
      return new Response("Error: x-host header is missing.", { status: 400 });
    }

    let targetUrl;
    if (targetHost.startsWith('http://') || targetHost.startsWith('https://')) {
      targetUrl = `${targetHost}${url.pathname}${url.search}`;
    } else {
      targetUrl = `https://${targetHost}${url.pathname}${url.search}`;
    }

    const headers = new Headers();
    let clientIp = null;

    for (const [key, value] of request.headers) {
      const k = key.toLowerCase();
      if (STRIP_HEADERS.has(k) || k.startsWith("x-nf-") || k.startsWith("x-netlify-") || k === "x-host") continue;
      
      if (k === "x-real-ip") {
        clientIp = value;
        continue;
      }
      if (k === "x-forwarded-for") {
        if (!clientIp) clientIp = value;
        continue;
      }
      headers.set(k, value);
    }

    if (clientIp) headers.set("x-forwarded-for", clientIp);

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: "manual",
      body: (request.method !== "GET" && request.method !== "HEAD") ? request.body : undefined,
    });

    const responseHeaders = new Headers();
    for (const [key, value] of upstream.headers) {
      if (key.toLowerCase() === "transfer-encoding") continue;
      responseHeaders.set(key, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response("Bad Gateway: Relay Failed", { status: 502 });
  }
}
