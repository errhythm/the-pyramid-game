import { use } from "react";
import ResultsPageClient from "./ResultsPageClient";

// Server component that unwraps the params
export default function ResultsPage({ params }: { params: Promise<{ gameId: string }> }) {
  const unwrappedParams = use(params);
  return <ResultsPageClient gameId={unwrappedParams.gameId} />;
} 