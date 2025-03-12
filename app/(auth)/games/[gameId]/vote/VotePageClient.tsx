"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, AlertTriangle } from "lucide-react";
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
  
  // Calculate maximum allowed votes based on participant count
  const calculateMaxVotes = (totalParticipants: number) => {
    const twentyPercent = Math.ceil(totalParticipants * 0.2);
    return Math.min(5, Math.max(1, twentyPercent));
  };
  
  // Check if all participants have voted
  const allParticipantsVoted = game?.participants.every(
    (p) => p.status === "VOTED" || p.status === "ABSTAINED"
  );

  // Function to complete the game
  const completeGame = async () => {
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
    } catch (error) {
      toast.error("Failed to complete game");
      setCheckingResults(false);
    }
  };
  
  // Fetch game data
  const fetchGame = async () => {
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
      
      // Check if the user has already voted
      const currentParticipant = data.participants.find(
        (p: { userId: string }) => p.userId === user?.id
      );
      
      if (currentParticipant?.status === "VOTED") {
        toast.info("You have already voted. Waiting for others to complete voting.");
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
    } catch (error) {
      toast.error("Failed to fetch game data");
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle participant selection
  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      const maxVotes = calculateMaxVotes(game?.participants.length || 0);
      if (selectedParticipants.length < maxVotes) {
        setSelectedParticipants([...selectedParticipants, userId]);
      } else {
        toast.error(`You can only vote for up to ${maxVotes} participant${maxVotes === 1 ? '' : 's'}`);
      }
    }
  };
  
  // Submit votes
  const submitVotes = async () => {
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
      fetchGame(); // Refresh game data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit votes");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Set up polling for game updates
  useEffect(() => {
    fetchGame();
    
    const interval = setInterval(fetchGame, 5000); // Poll every 5 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [gameId]);
  
  // Check if the current user has already voted
  const currentParticipant = game?.participants.find(
    (p) => p.userId === user?.id
  );
  const hasVoted = currentParticipant?.status === "VOTED";
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <p className="text-gray-400 mt-2">
          The game you're looking for doesn't exist or has been removed.
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
          <Badge variant="secondary">
            {timeLeft ? `Time left: ${timeLeft}` : "Game in progress"}
          </Badge>
        </div>
        <p className="text-gray-400 mt-2">
          Cast your votes for other participants
        </p>
      </div>
      
      <Card className="border-gray-800 bg-black/50 backdrop-blur-sm mb-6 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Voting Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>You can vote for up to {calculateMaxVotes(game?.participants.length || 0)} {calculateMaxVotes(game?.participants.length || 0) === 1 ? 'participant' : 'participants'}</li>
            <li>You cannot vote for yourself</li>
            <li>You cannot vote for the same person twice</li>
            <li>Your votes will determine the final rankings</li>
            <li>If you don't vote before the time limit, you'll receive an F rank</li>
            <li>Once you submit your votes, you cannot change them</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="border-gray-800 bg-black/50 backdrop-blur-sm shadow-[0_0_15px_rgba(124,58,237,0.15)]">
        <CardHeader>
          <CardTitle>Cast Your Votes</CardTitle>
          <CardDescription>
            Select up to {calculateMaxVotes(game?.participants.length || 0)} {calculateMaxVotes(game?.participants.length || 0) === 1 ? 'participant' : 'participants'} to vote for
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasVoted ? (
            <div className="text-center py-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 opacity-20 blur-xl"></div>
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4 relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Votes Submitted</h3>
              <p className="text-gray-400 mb-6">
                {allParticipantsVoted 
                  ? "All participants have completed voting!"
                  : "You have already cast your votes. Waiting for others to complete voting."}
              </p>
              {allParticipantsVoted && (
                <Button
                  onClick={completeGame}
                  disabled={checkingResults}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-[0_4px_10px_rgba(16,185,129,0.3)]"
                >
                  {checkingResults ? "Checking Results..." : "View Results"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {game.participants
                .filter((p) => p.userId !== user?.id) // Filter out the current user
                .map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedParticipants.includes(participant.userId)
                        ? "border-indigo-500 bg-indigo-950/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                        : "border-gray-800 hover:border-gray-700"
                    } cursor-pointer transition-all duration-200`}
                    onClick={() => toggleParticipant(participant.userId)}
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
                    {selectedParticipants.includes(participant.userId) && (
                      <Check className="h-5 w-5 text-indigo-500" />
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
        {!hasVoted && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-400">
              Selected: {selectedParticipants.length}/{calculateMaxVotes(game?.participants.length || 0)}
            </div>
            <Button
              onClick={submitVotes}
              disabled={submitting || selectedParticipants.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
            >
              {submitting ? "Submitting..." : "Submit Votes"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 