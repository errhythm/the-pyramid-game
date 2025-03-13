"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Clock, Copy, QrCode, Play, Users, Triangle } from "lucide-react";
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

export default function GamePageClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { user } = useUser();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  
  const isHost = useMemo(() => user?.id === game?.hostId, [user?.id, game?.hostId]);
  const isWaiting = useMemo(() => game?.status === "WAITING", [game?.status]);
  
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
      
      // If game is active, redirect to voting page
      if (data.status === "ACTIVE") {
        router.push(`/games/${gameId}/vote`);
      }
      
      // If game is completed, redirect to results page
      if (data.status === "COMPLETED") {
        router.push(`/games/${gameId}/results`);
      }
    } catch {
      toast.error("Failed to fetch game data");
    } finally {
      setLoading(false);
    }
  }, [gameId, router]);
  
  // Copy game code to clipboard
  const copyGameCode = useCallback(() => {
    if (game) {
      navigator.clipboard.writeText(game.code);
      toast.success("Game code copied to clipboard");
    }
  }, [game]);
  
  // Start the game
  const startGame = useCallback(async () => {
    if (!game) return;
    
    setStarting(true);
    try {
      const response = await fetch(`/api/games/${game.id}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timeLimit: game.timeLimit }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to start game");
      }
      
      toast.success("Game started successfully!");
      router.push(`/games/${game.id}/vote`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start game");
    } finally {
      setStarting(false);
    }
  }, [game, router]);
  
  // Set up polling for game updates with optimized interval
  useEffect(() => {
    fetchGame();
    
    // Use a longer polling interval (10 seconds) for waiting state
    const interval = setInterval(fetchGame, isWaiting ? 10000 : 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [gameId, fetchGame, isWaiting]);
  
  // Memoize participant list
  const participantList = useMemo(() => {
    if (!game?.participants) return null;
    
    return game.participants.map((participant) => (
      <div
        key={participant.id}
        className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-gray-800/50"
      >
        <div className="flex items-center gap-3">
          <Avatar className="border-2 border-transparent">
            <AvatarImage src={participant.user.imageUrl || undefined} />
            <AvatarFallback className="bg-purple-500/10 text-purple-400">
              {participant.user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-200">{participant.user.name}</p>
            {participant.userId === game.hostId && (
              <p className="text-xs text-purple-400">Host</p>
            )}
          </div>
        </div>
        {game.status !== "WAITING" && (
          <Badge 
            variant={participant.status === "VOTED" ? "default" : "outline"}
            className={`
              ${participant.status === "VOTED" 
                ? "bg-purple-500/20 text-purple-400 border-purple-500/20" 
                : "border-gray-700 text-gray-400"}
            `}
          >
            {participant.status === "JOINED" && "Not voted"}
            {participant.status === "VOTED" && "Voted"}
            {participant.status === "ABSTAINED" && "Abstained"}
          </Badge>
        )}
      </div>
    ));
  }, [game?.participants, game?.hostId, game?.status]);
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
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
              <h1 className="text-3xl font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent">{game.title}</h1>
              <p className="text-zinc-400">
                Hosted by {game.host.name}
              </p>
            </div>
            <Badge 
              variant={isWaiting ? "outline" : "secondary"}
              className="bg-black/50 backdrop-blur-sm border-zinc-800/50 text-zinc-400"
            >
              {game.status === "WAITING" && "Waiting for players"}
              {game.status === "ACTIVE" && "Game in progress"}
              {game.status === "COMPLETED" && "Game completed"}
              {game.status === "CANCELLED" && "Game cancelled"}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Participants Card */}
          <Card className="relative w-full border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl pt-8">
            {/* Card inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/5 via-transparent to-zinc-700/5" />
            
            {/* Logo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-xl">
                <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-6 h-6 text-zinc-200" />
                </div>
              </div>
            </div>

            <CardHeader className="relative pb-0 text-center space-y-0">
              <CardTitle className="text-lg font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Participants ({game._count.participants})
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {isWaiting
                  ? "Players who have joined the game"
                  : "Players participating in the game"}
              </CardDescription>
            </CardHeader>
            <Separator className="my-2 bg-zinc-800/50" />
            <CardContent className="relative p-4">
              <div className="space-y-4">
                {game?.participants.length === 0 ? (
                  <p className="text-zinc-400 text-center py-4">
                    No participants yet
                  </p>
                ) : participantList}
              </div>
            </CardContent>
          </Card>
          
          {/* Game Info Card */}
          <Card className="relative w-full border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl pt-8">
            {/* Card inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/5 via-transparent to-zinc-700/5" />
            
            {/* Logo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-xl">
                <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Triangle className="w-6 h-6 text-zinc-200" />
                </div>
              </div>
            </div>

            <CardHeader className="relative pb-0 text-center space-y-0">
              <CardTitle className="text-lg font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Game Information
              </CardTitle>
            </CardHeader>
            <Separator className="my-2 bg-zinc-800/50" />
            <CardContent className="relative p-4 space-y-6">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2">Game Code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                    <p className="text-2xl font-mono tracking-widest bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent font-bold">{game.code}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                    onClick={copyGameCode}
                  >
                    <Copy className="h-4 w-4 text-zinc-400" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                  >
                    <QrCode className="h-4 w-4 text-zinc-400" />
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-2">Time Limit</p>
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-zinc-400" />
                    <p className="text-lg text-zinc-200">{game.timeLimit} minutes</p>
                  </div>
                </div>
              </div>
              
              {isHost && isWaiting && (
                <Button
                  onClick={startGame}
                  disabled={starting || game._count.participants < 2}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors h-12"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {starting ? "Starting..." : "Start Game"}
                </Button>
              )}
            </CardContent>
          </Card>
          
          {isHost && isWaiting && game._count.participants < 2 && (
            <p className="text-sm text-center text-zinc-400 md:col-span-2">
              At least 2 participants are required to start the game
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 