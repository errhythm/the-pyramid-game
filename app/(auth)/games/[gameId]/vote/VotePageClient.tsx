"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, AlertTriangle, Clock, Triangle } from "lucide-react";
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

export default function VotePageClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { user } = useUser();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [checkingResults, setCheckingResults] = useState(false);
  
  // Memoize calculations
  const maxVotes = useMemo(() => {
    if (!game?.participants) return 1;
    const twentyPercent = Math.ceil(game.participants.length * 0.2);
    return Math.min(5, Math.max(1, twentyPercent));
  }, [game?.participants]);
  
  const allParticipantsVoted = useMemo(() => 
    game?.participants.every(
      (p) => p.status === "VOTED" || p.status === "ABSTAINED"
    ),
    [game?.participants]
  );

  const currentParticipant = useMemo(() => 
    game?.participants.find((p) => p.userId === user?.id),
    [game?.participants, user?.id]
  );

  const hasVoted = useMemo(() => 
    currentParticipant?.status === "VOTED" || currentParticipant?.status === "ABSTAINED",
    [currentParticipant?.status]
  );

  // Function to complete the game
  const completeGame = useCallback(async () => {
    setCheckingResults(true);
    try {
      const response = await fetch(`/api/games/${gameId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete game");
      }

      toast.success("Game completed! Redirecting to results...");
      setTimeout(() => {
        router.push(`/games/${gameId}/results`);
      }, 1500);
    } catch {
      toast.error("Failed to complete game");
      setCheckingResults(false);
    }
  }, [gameId, router]);
  
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
      
      // If game is not active, redirect to appropriate page
      if (data.status === "WAITING") {
        router.push(`/games/${gameId}`);
        return;
      }
      
      if (data.status === "COMPLETED") {
        router.push(`/games/${gameId}/results`);
        return;
      }
      
      // Calculate time left
      if (data.endTime) {
        const endTime = new Date(data.endTime);
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          // Game has ended
          toast.info("Time's up! Redirecting to results...");
          setTimeout(() => {
            router.push(`/games/${gameId}/results`);
          }, 2000);
        } else {
          // Update time left
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }
    } catch {
      toast.error("Failed to fetch game data");
    } finally {
      setLoading(false);
    }
  }, [gameId, router]);
  
  // Toggle participant selection
  const toggleParticipant = useCallback((userId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        if (prev.length < maxVotes) {
          return [...prev, userId];
        } else {
          toast.error(`You can only vote for up to ${maxVotes} participant${maxVotes === 1 ? '' : 's'}`);
          return prev;
        }
      }
    });
  }, [maxVotes]);
  
  // Submit votes
  const submitVotes = useCallback(async () => {
    if (selectedParticipants.length === 0) {
      toast.error("Please select at least one participant to vote for");
      return;
    }
    
    setSubmitting(true);
    try {
      const votes = selectedParticipants.map((toUserId) => ({ toUserId }));
      
      const response = await fetch(`/api/games/${gameId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ votes }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit votes");
      }
      
      toast.success("Votes submitted successfully!");
      fetchGame();
    } catch {
      toast.error("Failed to submit votes");
    } finally {
      setSubmitting(false);
    }
  }, [selectedParticipants, gameId, fetchGame]);
  
  // Skip voting (abstain)
  const skipVoting = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/games/${gameId}/vote/skip`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to skip voting");
      }
      
      toast.success("Skipped voting successfully!");
      fetchGame();
    } catch {
      toast.error("Failed to skip voting");
    } finally {
      setSubmitting(false);
    }
  }, [gameId, fetchGame]);
  
  // Set up polling for game updates with optimized interval
  useEffect(() => {
    fetchGame();
    
    // Use a longer polling interval if the user has voted
    const interval = setInterval(fetchGame, hasVoted ? 10000 : 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameId, fetchGame, hasVoted]);
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-[600px] rounded-3xl" />
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
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay bg-noise"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-conic from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-slow-spin"></div>
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-3xl"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">{game.title}</h1>
              <p className="text-gray-400">
                Cast your votes wisely
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline"
                className="bg-black/50 backdrop-blur-sm border-purple-500/20 text-purple-400 px-4 py-2"
              >
                <Clock className="w-4 h-4 mr-2" />
                {timeLeft}
              </Badge>
              <Badge 
                variant="outline"
                className="bg-black/50 backdrop-blur-sm border-purple-500/20 text-purple-400 px-4 py-2"
              >
                {game._count.votes} / {game._count.participants} voted
              </Badge>
            </div>
          </div>
        </div>
        
        <Card className="border-gray-800/50 bg-black/30 backdrop-blur-xl shadow-[0_0_25px_rgba(124,58,237,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5"></div>
          
          <CardHeader className="relative">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {hasVoted ? "Waiting for others" : "Select Participants"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {hasVoted 
                ? "You have already cast your votes. Waiting for others to complete voting."
                : `Select up to ${maxVotes} participants to vote for`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative">
            {hasVoted ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`
                        p-4 rounded-xl border transition-all duration-300
                        ${participant.status === "VOTED"
                          ? "bg-purple-500/10 border-purple-500/20"
                          : participant.status === "ABSTAINED"
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-black/30 border-gray-800/50"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-transparent">
                          <AvatarImage src={participant.user.imageUrl || undefined} />
                          <AvatarFallback className={`
                            ${participant.status === "VOTED"
                              ? "bg-purple-500/10 text-purple-400"
                              : participant.status === "ABSTAINED"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-gray-500/10 text-gray-400"}
                          `}>
                            {participant.user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-200">{participant.user.name}</p>
                          <Badge 
                            variant="outline"
                            className={`
                              mt-1 text-xs
                              ${participant.status === "VOTED"
                                ? "border-purple-500/20 text-purple-400"
                                : participant.status === "ABSTAINED"
                                ? "border-red-500/20 text-red-400"
                                : "border-gray-700 text-gray-400"}
                            `}
                          >
                            {participant.status === "VOTED" && "Voted"}
                            {participant.status === "ABSTAINED" && "Abstained"}
                            {participant.status === "JOINED" && "Not voted"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {allParticipantsVoted && (
                  <div className="flex justify-center">
                    <Button
                      onClick={completeGame}
                      disabled={checkingResults}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-[0_4px_10px_rgba(124,58,237,0.3)] transition-all duration-300"
                    >
                      {checkingResults ? "Checking results..." : "View Results"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.participants
                    .filter((p) => p.userId !== user?.id) // Exclude current user
                    .map((participant) => (
                      <button
                        key={participant.id}
                        onClick={() => toggleParticipant(participant.userId)}
                        disabled={submitting}
                        className={`
                          p-4 rounded-xl border w-full text-left
                          ${selectedParticipants.includes(participant.userId)
                            ? "bg-purple-500/10 border-purple-500/20"
                            : "bg-black/30 border-gray-800/50"}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className={`
                            border-2
                            ${selectedParticipants.includes(participant.userId)
                              ? "border-purple-500/20"
                              : "border-transparent"}
                          `}>
                            <AvatarImage src={participant.user.imageUrl || undefined} />
                            <AvatarFallback className={`
                              ${selectedParticipants.includes(participant.userId)
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-gray-500/10 text-gray-400"}
                            `}>
                              {participant.user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-gray-200">{participant.user.name}</p>
                            {selectedParticipants.includes(participant.userId) && (
                              <Badge 
                                variant="outline"
                                className="mt-1 border-purple-500/20 text-purple-400"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                          {selectedParticipants.includes(participant.userId) && (
                            <Check className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    onClick={submitVotes}
                    disabled={submitting || selectedParticipants.length === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-[0_4px_10px_rgba(124,58,237,0.3)] transition-all duration-300 h-12"
                  >
                    {submitting ? "Submitting..." : "Submit Votes"}
                  </Button>
                  <Button
                    onClick={skipVoting}
                    disabled={submitting}
                    variant="outline"
                    className="flex-1 border-gray-800/50 bg-black/30 hover:bg-red-900/20 hover:border-red-500/20 hover:text-red-400 transition-all duration-300 h-12"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Skip Voting
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 