import { exploreUrl, initialExploreState } from "@/components/careers/explorer/state";

export async function GET(request: Request, { params }: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  const career = new URL(request.url).searchParams.get("career");
  const location = exploreUrl({
    ...initialExploreState,
    direction: areaId,
    career,
    step: career ? "work" : "industries",
  });
  return new Response(null, { status: 307, headers: { Location: location } });
}
