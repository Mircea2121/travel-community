import { GET as getAuthenticatedProfile } from "../me/route";

export const runtime = "nodejs";

// Optional session discovery for public UI. Protected APIs retain their 401s.
export async function GET() {
  const response = await getAuthenticatedProfile();
  if (response.status !== 401) return response;
  return Response.json({ success: true, user: null }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
