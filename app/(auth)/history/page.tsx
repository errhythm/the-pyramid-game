"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, Users, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Game {
  id: string;
  code: string;
  title: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  timeLimit: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
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

export default function HistoryPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch games
  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games");
      
      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }
      
      const data = await response.json();
      setGames(data);
    } catch {
      toast.error("Failed to fetch game history");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGames();
  }, []);
  
  // Filter games by status
  const activeGames = games.filter((game) => game.status === "ACTIVE" || game.status === "WAITING");
  const completedGames = games.filter((game) => game.status === "COMPLETED");
  const cancelledGames = games.filter((game) => game.status === "CANCELLED");
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING":
        return <Badge variant="outline">Waiting for players</Badge>;
      case "ACTIVE":
        return <Badge variant="secondary">In progress</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };
  
  // Render game card
  const renderGameCard = (game: Game) => (
    <Card key={game.id} className="bg-zinc-900 border-zinc-800">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{game.title}</CardTitle>
          {getStatusBadge(game.status)}
        </div>
        <CardDescription className="text-zinc-400">
          Created {formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-zinc-400">
            <Users className="h-4 w-4 mr-2 text-purple-400" />
            <span>{game._count.participants} participants</span>
          </div>
          <div className="flex items-center text-sm text-zinc-400">
            <Clock className="h-4 w-4 mr-2 text-purple-400" />
            <span>{game.timeLimit} minutes time limit</span>
          </div>
          <div className="flex items-center text-sm text-zinc-400">
            <Calendar className="h-4 w-4 mr-2 text-purple-400" />
            <span>
              {game.status === "WAITING" && "Not started yet"}
              {game.status === "ACTIVE" && game.startTime && `Started ${formatDistanceToNow(new Date(game.startTime), { addSuffix: true })}`}
              {game.status === "COMPLETED" && game.endTime && `Ended ${formatDistanceToNow(new Date(game.endTime), { addSuffix: true })}`}
              {game.status === "CANCELLED" && "Cancelled"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white transition-colors"
          onClick={() => {
            if (game.status === "COMPLETED") {
              router.push(`/games/${game.id}/results`);
            } else {
              router.push(`/games/${game.id}`);
            }
          }}
        >
          {game.status === "COMPLETED" ? "View Results" : "View Game"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Skeleton className="h-5 w-96 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-full bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-zinc-800" />
          <Skeleton className="h-64 bg-zinc-800" />
          <Skeleton className="h-64 bg-zinc-800" />
          <Skeleton className="h-64 bg-zinc-800" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Game History</h1>
        <p className="text-zinc-400">
          View all your past and current games
        </p>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-zinc-900 border-zinc-800">
          <TabsTrigger 
            value="active"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Active Games ({activeGames.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Completed ({completedGames.length})
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            Cancelled ({cancelledGames.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">You have no active games</p>
              <Button 
                onClick={() => router.push("/")} 
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create a Game
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGames.map(renderGameCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {completedGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-4">You have no completed games</p>
              <Button 
                onClick={() => router.push("/")} 
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create a Game
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGames.map(renderGameCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled">
          {cancelledGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-400">You have no cancelled games</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cancelledGames.map(renderGameCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 