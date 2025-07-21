import PageClientImpl from "./pageClient";

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ hq?: string; region?: string }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;

  const hq = _searchParams.hq === "true" ? true : false;

  return (
    <PageClientImpl
      roomName={_params.roomName}
      region={_searchParams.region}
      hq={hq}
    />
  );
}
