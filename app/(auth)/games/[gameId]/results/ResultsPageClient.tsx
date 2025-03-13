"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Trophy, Medal, Home, Triangle, RefreshCw } from "lucide-react";
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
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGame();
  }, [fetchGame]);
  
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);
  
  // Group participants by rank
  const participantsByRank = useMemo(() => ({
    A: game?.participants.filter((p) => p.rank === "A") || [],
    B: game?.participants.filter((p) => p.rank === "B") || [],
    C: game?.participants.filter((p) => p.rank === "C") || [],
    D: game?.participants.filter((p) => p.rank === "D") || [],
    F: game?.participants.filter((p) => p.rank === "F") || [],
  }), [game?.participants]);
  
  // Get rank icon
  const getRankIcon = useCallback((rank: string) => {
    switch (rank) {
      case "A":
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case "B":
        return <Medal className="h-6 w-6 text-gray-300" />;
      case "C":
        return <Medal className="h-6 w-6 text-amber-600" />;
      case "D":
        return null;
      case "F":
        return null;
      default:
        return null;
    }
  }, []);
  
  // Get rank gradient
  const getRankGradient = useCallback((rank: string) => {
    switch (rank) {
      case "A":
        return "from-yellow-400 to-amber-600";
      case "B":
        return "from-gray-300 to-gray-500";
      case "C":
        return "from-amber-600 to-amber-800";
      case "D":
        return "from-gray-600 to-gray-800";
      case "F":
        return "from-red-600 to-red-800";
      default:
        return "from-gray-700 to-gray-900";
    }
  }, []);

  // Memoize rank cards
  const rankCards = useMemo(() => (
    ["A", "B", "C", "D", "F"].map((rank) => (
      <Card 
        key={rank} 
        className={`
          border-gray-800/50 bg-black/30 backdrop-blur-xl shadow-[0_0_25px_rgba(124,58,237,0.1)] 
          relative overflow-hidden
          ${rank === "F" ? "border-red-500/20" : ""}
        `}
      >
        <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${getRankGradient(rank)}`}></div>
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-2xl">
              {getRankIcon(rank)}
              <div className={`ml-2 px-4 py-1 rounded-xl text-sm font-bold bg-gradient-to-r ${getRankGradient(rank)}`}>
                Rank {rank}
              </div>
            </CardTitle>
            <Badge 
              variant="outline"
              className={`
                bg-black/50 backdrop-blur-sm px-4 py-2
                ${rank === "F" 
                  ? "border-red-500/20 text-red-400" 
                  : "border-purple-500/20 text-purple-400"}
              `}
            >
              {participantsByRank[rank as keyof typeof participantsByRank].length} participants
            </Badge>
          </div>
          <CardDescription className="text-gray-400">
            {rank === "A" && "Top performers with the most votes"}
            {rank === "B" && "Strong performers with many votes"}
            {rank === "C" && "Average performers with moderate votes"}
            {rank === "D" && "Below average performers with few votes"}
            {rank === "F" && "Participants who received no votes or abstained"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative">
          {participantsByRank[rank as keyof typeof participantsByRank].length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No participants with this rank
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participantsByRank[rank as keyof typeof participantsByRank].map((participant) => (
                <div
                  key={participant.id}
                  className={`
                    p-4 rounded-xl border
                    ${rank === "F"
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-black/30 border-gray-800/50"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className={`
                      border-2
                      ${rank === "F"
                        ? "border-red-500/20"
                        : "border-purple-500/20"}
                    `}>
                      <AvatarImage src={participant.user.imageUrl || undefined} />
                      <AvatarFallback className={`
                        ${rank === "F"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-purple-500/10 text-purple-400"}
                      `}>
                        {participant.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{participant.user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline"
                          className={`
                            text-xs
                            ${rank === "F"
                              ? "border-red-500/20 text-red-400"
                              : "border-purple-500/20 text-purple-400"}
                          `}
                        >
                          {participant.voteCount} {participant.voteCount === 1 ? "vote" : "votes"}
                        </Badge>
                        {participant.status === "ABSTAINED" && (
                          <Badge 
                            variant="outline"
                            className="text-xs border-red-500/20 text-red-400"
                          >
                            Abstained
                          </Badge>
                        )}
                        {game && participant.userId === game.hostId && (
                          <Badge 
                            variant="outline"
                            className="text-xs border-purple-500/20 text-purple-400"
                          >
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ))
  ), [participantsByRank, getRankIcon, getRankGradient, game?.hostId]);
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-2xl blur-xl"></div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-white/[0.05] shadow-[0_0_25px_rgba(239,68,68,0.2)] relative">
              <Triangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Game not found</h1>
        <p className="text-gray-400">
          The game you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button 
          onClick={() => router.push("/")}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-[0_4px_10px_rgba(239,68,68,0.3)] transition-all duration-300"
        >
          Go Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay bg-noise"></div>
      
      {/* Background gradient effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-conic from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-slow-spin"></div>
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">{game.title}</h1>
              <p className="text-gray-400">
                Final rankings based on votes {game.status !== "COMPLETED" && "- Waiting for game to complete"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-800/50 bg-black/30 hover:bg-purple-900/20 hover:border-purple-500/20 transition-all duration-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Badge 
                variant="outline"
                className="bg-black/50 backdrop-blur-sm border-purple-500/20 text-purple-400 px-4 py-2"
              >
                Game Results
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {rankCards}
        </div>
      </div>
    </div>
  );
} 