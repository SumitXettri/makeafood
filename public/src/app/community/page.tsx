import CommunityClient from "./CommunityClient";

export default async function Community({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.query || "";

  return <CommunityClient initialQuery={initialQuery} />;
}
