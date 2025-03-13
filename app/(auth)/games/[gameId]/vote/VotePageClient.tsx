"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, AlertTriangle, Triangle } from "lucide-react";
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
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Triangle className="h-8 w-8 text-zinc-400" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Game not found</h1>
          <p className="text-zinc-400">
            The game you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button 
            onClick={() => router.push("/")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-zinc-950"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{game.title}</h1>
            <p className="text-zinc-400">
              Cast your votes wisely
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge 
              variant="outline"
              className="bg-zinc-800/50 border-zinc-700 text-zinc-400 px-4 py-2 w-full sm:w-auto"
            >
              {Math.round((game.participants.filter(p => p.status === "VOTED").length / game._count.participants) * 100)}% voted
            </Badge>
          </div>
        </div>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-xl text-white">
              {hasVoted ? "Waiting for others" : "Select Participants"}
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1.5">
              {hasVoted 
                ? "You have already cast your votes. Waiting for others to complete voting."
                : `Select up to ${maxVotes} participants to vote for`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pt-6">
            {hasVoted ? (
              <div className="space-y-6">
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-zinc-800/80 p-6 rounded-full border border-purple-500/30">
                      <Check className="w-12 h-12 text-purple-400" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-white">Votes Cast Successfully!</h2>
                    <p className="text-zinc-400">
                      Your magical votes have been sealed. The pyramid&apos;s mysteries will be revealed once all participants complete their voting.
                    </p>
                  </div>
                  
                  {game.hostId === user?.id && allParticipantsVoted && (
                    <Button
                      onClick={completeGame}
                      disabled={checkingResults}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-11"
                    >
                      {checkingResults ? "Revealing Results..." : "Reveal Results"}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.participants
                    .filter((p) => p.userId !== user?.id)
                    .map((participant) => (
                      <button
                        key={participant.id}
                        onClick={() => toggleParticipant(participant.userId)}
                        disabled={submitting}
                        className={`
                          p-4 rounded-xl border w-full text-left transition-all duration-300
                          ${selectedParticipants.includes(participant.userId)
                            ? "bg-zinc-800/80 border-purple-500/50"
                            : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/80 hover:border-zinc-600"}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className={`
                            h-10 w-10 border-2 transition-all duration-300
                            ${selectedParticipants.includes(participant.userId)
                              ? "border-purple-500/50"
                              : "border-transparent"}
                          `}>
                            <AvatarImage src={participant.user.imageUrl || undefined} />
                            <AvatarFallback className={`
                              ${selectedParticipants.includes(participant.userId)
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-zinc-800 text-zinc-400"}
                            `}>
                              {participant.user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-zinc-200">{participant.user.name}</p>
                            {selectedParticipants.includes(participant.userId) && (
                              <Badge 
                                variant="outline"
                                className="mt-2 border-purple-500/50 text-purple-400"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                          {selectedParticipants.includes(participant.userId) && (
                            <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <Button
                    onClick={submitVotes}
                    disabled={submitting || selectedParticipants.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-11"
                  >
                    {submitting ? "Submitting..." : "Submit Votes"}
                  </Button>
                  <Button
                    onClick={skipVoting}
                    disabled={submitting}
                    variant="outline"
                    className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-red-500/50 hover:text-red-400 h-11"
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