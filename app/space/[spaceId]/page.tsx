import PageClientImpl from "./pageClient";

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    hq?: string;
    region?: string;
    title?: string;
    host?: string;
  }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;

  const hq = _searchParams.hq === "true" ? true : false;
  const title = _searchParams.title;
  const host = _searchParams.host === "true" ? true : false;

  return (
    <PageClientImpl
      roomName={_params.roomName}
      region={_searchParams.region}
      hq={hq}
      title={title}
      host={host}
    />
  );
}
