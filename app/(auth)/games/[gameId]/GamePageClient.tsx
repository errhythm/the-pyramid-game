"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Clock, Copy, QrCode, Play, Users } from "lucide-react";
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
  
  const isHost = user?.id === game?.hostId;
  const isWaiting = game?.status === "WAITING";
  
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
  const copyGameCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.code);
      toast.success("Game code copied to clipboard");
    }
  };
  
  // Start the game
  const startGame = async () => {
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
  };
  
  // Set up polling for game updates
  useEffect(() => {
    fetchGame();
    
    const interval = setInterval(fetchGame, 5000); // Poll every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [gameId]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <p className="text-gray-400 text-center py-4">
          The game you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <Badge variant={isWaiting ? "outline" : "secondary"}>
            {game.status === "WAITING" && "Waiting for players"}
            {game.status === "ACTIVE" && "Game in progress"}
            {game.status === "COMPLETED" && "Game completed"}
            {game.status === "CANCELLED" && "Game cancelled"}
          </Badge>
        </div>
        <p className="text-gray-400 mt-2">
          Hosted by {game.host.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Participants ({game._count.participants})
            </CardTitle>
            <CardDescription>
              {isWaiting
                ? "Players who have joined the game"
                : "Players participating in the game"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {game.participants.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No participants yet
                </p>
              ) : (
                game.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between"
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
                    {game.status !== "WAITING" && (
                      <Badge variant={participant.status === "VOTED" ? "default" : "outline"}>
                        {participant.status === "JOINED" && "Not voted"}
                        {participant.status === "VOTED" && "Voted"}
                        {participant.status === "ABSTAINED" && "Abstained"}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-400">Game Code</p>
                <div className="flex items-center mt-1">
                  <p className="text-2xl font-mono tracking-widest bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold">{game.code}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 hover:bg-purple-900/20 transition-colors"
                    onClick={copyGameCode}
                  >
                    <Copy className="h-4 w-4 text-purple-400" />
                  </Button>
                </div>
              </div>
              
              <Separator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              
              <div>
                <p className="text-sm font-medium text-gray-400">Time Limit</p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                  <p>{game.timeLimit} minutes</p>
                </div>
              </div>
              
              {isHost && isWaiting && (
                <>
                  <Separator className="bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  <div className="pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
                      disabled={starting || game._count.participants < 2}
                      onClick={startGame}
                    >
                      {starting ? (
                        "Starting..."
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Start Game
                        </>
                      )}
                    </Button>
                    {game._count.participants < 2 && (
                      <p className="text-amber-500 text-xs mt-2">
                        At least 2 participants are required to start the game
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {isWaiting && (
            <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Share Game</CardTitle>
                <CardDescription>
                  Invite others to join using the code or QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 inline-block rounded-lg mb-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <QrCode className="h-32 w-32 text-black" />
                </div>
                <p className="text-sm text-gray-400">
                  Scan the QR code or share the game code: <strong className="font-mono tracking-widest text-purple-400">{game.code}</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 