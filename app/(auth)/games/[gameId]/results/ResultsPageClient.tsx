"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trophy, Medal, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Game {
  id: string;
  code: string;
  title: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  timeLimit: number;
  startTime: string | null;
  endTime: string | null;
  hostId: string;
  host: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  participants: {
    id: string;
    userId: string;
    status: "JOINED" | "VOTED" | "ABSTAINED";
    rank: "A" | "B" | "C" | "D" | "F" | null;
    voteCount: number;
    user: {
      name: string;
      imageUrl: string | null;
    };
  }[];
  _count: {
    participants: number;
    votes: number;
  };
}

export default function ResultsPageClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch game data
  const fetchGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Game not found");
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch game");
      }
      
      const data = await response.json();
      setGame(data);
      
      // If game is not completed, check if we need to redirect
      if (data.status === "WAITING") {
        router.push(`/games/${gameId}`);
        return;
      }
      
      if (data.status === "ACTIVE") {
        router.push(`/games/${gameId}/vote`);
        return;
      }
    } catch {
      toast.error("Failed to fetch game data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameId, router]);
  
  // Function to handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGame();
  };
  
  useEffect(() => {
    fetchGame();
  }, [gameId, fetchGame]);
  
  // Group participants by rank
  const participantsByRank = {
    A: game?.participants.filter((p) => p.rank === "A") || [],
    B: game?.participants.filter((p) => p.rank === "B") || [],
    C: game?.participants.filter((p) => p.rank === "C") || [],
    D: game?.participants.filter((p) => p.rank === "D") || [],
    F: game?.participants.filter((p) => p.rank === "F") || [],
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <p className="text-gray-400 mt-2">
          The game you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }
  
  // Get rank icon
  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "A":
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case "B":
        return <Medal className="h-6 w-6 text-gray-400" />;
      case "C":
        return <Medal className="h-6 w-6 text-amber-700" />;
      case "D":
        return null;
      case "F":
        return null;
      default:
        return null;
    }
  };
  
  // Get rank color
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "A":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      case "B":
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-black";
      case "C":
        return "bg-gradient-to-r from-amber-600 to-amber-800";
      case "D":
        return "bg-gradient-to-r from-gray-600 to-gray-800";
      case "F":
        return "bg-gradient-to-r from-red-600 to-red-800";
      default:
        return "bg-gray-700";
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-indigo-900/20 hover:text-white transition-colors"
            >
              {refreshing ? "Refreshing..." : "Refresh Results"}
            </Button>
            <Badge variant="secondary">
              Game Results
            </Badge>
          </div>
        </div>
        <p className="text-gray-400 mt-2">
          Final rankings based on votes {game.status !== "COMPLETED" && "- Waiting for game to complete"}
        </p>
      </div>
      
      <div className="space-y-6">
        {["A", "B", "C", "D", "F"].map((rank) => (
          <Card key={rank} className="border-gray-800 bg-black/50 backdrop-blur-sm shadow-[0_0_15px_rgba(124,58,237,0.15)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  {getRankIcon(rank)}
                  <span className={`ml-2 px-3 py-1 rounded-md text-sm font-bold ${getRankColor(rank)}`}>
                    Rank {rank}
                  </span>
                </CardTitle>
                <Badge variant="outline">
                  {participantsByRank[rank as keyof typeof participantsByRank].length} participants
                </Badge>
              </div>
              <CardDescription>
                {rank === "A" && "Top performers with the most votes"}
                {rank === "B" && "Strong performers with many votes"}
                {rank === "C" && "Average performers with moderate votes"}
                {rank === "D" && "Below average performers with few votes"}
                {rank === "F" && "Participants who received no votes or abstained"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participantsByRank[rank as keyof typeof participantsByRank].length === 0 ? (
                <p className="text-gray-400 text-center py-2">
                  No participants with this rank
                </p>
              ) : (
                <div className="space-y-3">
                  {participantsByRank[rank as keyof typeof participantsByRank].map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={participant.user.imageUrl || undefined} />
                          <AvatarFallback>
                            {participant.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.user.name}</p>
                          {participant.userId === game.hostId && (
                            <p className="text-xs text-gray-400">Host</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {participant.voteCount} {participant.voteCount === 1 ? "vote" : "votes"}
                        </Badge>
                        {participant.status === "ABSTAINED" && (
                          <Badge variant="destructive">Abstained</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={() => router.push("/")} 
          className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
        >
          <Home className="mr-2 h-4 w-4" /> Return Home
        </Button>
      </div>
    </div>
  );
} 