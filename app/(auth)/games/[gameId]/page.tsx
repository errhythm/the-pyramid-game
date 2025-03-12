import { use } from "react";
import GamePageClient from "./GamePageClient";

// Server component that unwraps the params
export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const unwrappedParams = use(params);
  return <GamePageClient gameId={unwrappedParams.gameId} />;
} 