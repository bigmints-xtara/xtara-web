const localOrigins = new Set(["http://localhost:8840", "http://127.0.0.1:8840"]);

export async function POST(request: Request): Promise<Response> {
  const target = process.env.XTARA_API_PROXY_TARGET;
  if (process.env.NODE_ENV !== "development" || !target) {
    return new Response(null, { status: 404 });
  }

  if (!localOrigins.has(request.headers.get("origin") ?? "")) {
    return Response.json({ error: "Origin is not allowed" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
    return Response.json({ error: "JSON content type required" }, { status: 415 });
  }

  // The local server has verified the browser origin. Forward only the
  // credential body so the API can verify the Firebase token and mint its cookie.
  try {
    const upstream = await fetch(`${target.replace(/\/$/, "")}/api/v1/auth/session`, {
      method: "POST",
      headers: { "content-type": contentType },
      body: await request.text(),
      redirect: "error",
      cache: "no-store",
      signal: request.signal,
    });
    const headers = new Headers({ "cache-control": "no-store" });
    const responseType = upstream.headers.get("content-type");
    if (responseType) headers.set("content-type", responseType);
    for (const cookie of upstream.headers.getSetCookie()) headers.append("set-cookie", cookie);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return Response.json({ error: "The Xtara session service is unavailable" }, { status: 502 });
  }
}
