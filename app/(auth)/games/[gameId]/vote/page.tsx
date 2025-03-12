import { use } from "react";
import VotePageClient from "./VotePageClient";

// Server component that unwraps the params
export default function VotePage({ params }: { params: Promise<{ gameId: string }> }) {
  const unwrappedParams = use(params);
  return <VotePageClient gameId={unwrappedParams.gameId} />;
} 