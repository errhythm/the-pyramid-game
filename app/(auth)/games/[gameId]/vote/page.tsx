import { use } from "react";
import VotePageClient from "./VotePageClient";

// Server component that unwraps the params
export default function VotePage({ params }: { params: Promise<{ gameId: string }> }) {
  const unwrappedParams = use(params);
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <VotePageClient gameId={unwrappedParams.gameId} />
    </div>
  );
} 