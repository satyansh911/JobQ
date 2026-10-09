/**
 * Is the backend up? Answers within three seconds either way.
 *
 * The backend is stopped between demos. A stopped instance drops connections
 * rather than refusing them, so a proxied API call only fails once the proxy's
 * connect timeout runs out — about 30 seconds. Checking a health endpoint with
 * a short timeout lets the app say "offline" almost immediately instead.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const host = process.env.BACKEND_HOST?.replace(/\/+$/, "");
  const headers = { "Cache-Control": "no-store" };

  // No proxy in front (local dev, Compose): the app talks to the services
  // directly, so there is nothing for this route to vouch for.
  if (!host) return Response.json({ online: true }, { headers });

  try {
    const res = await fetch(`${host}:5003/health`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    return Response.json({ online: res.ok }, { headers });
  } catch {
    return Response.json({ online: false }, { headers });
  }
}
