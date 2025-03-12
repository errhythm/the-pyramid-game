"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    } catch (error) {
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
    <Card key={game.id} className="border-gray-800 bg-black/50 backdrop-blur-sm shadow-[0_0_15px_rgba(124,58,237,0.15)] hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{game.title}</CardTitle>
          {getStatusBadge(game.status)}
        </div>
        <CardDescription>
          Created {formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-400">
            <Users className="h-4 w-4 mr-2 text-indigo-400" />
            <span>{game._count.participants} participants</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-purple-400" />
            <span>{game.timeLimit} minutes time limit</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-pink-400" />
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
          className="w-full hover:bg-indigo-900/20 hover:text-white transition-colors"
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
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-1/2 mb-8" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Game History</h1>
        <p className="text-gray-400 mt-2">
          View all your past and current games
        </p>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="active">
            Active Games ({activeGames.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedGames.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledGames.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">You have no active games</p>
              <Button 
                onClick={() => router.push("/")} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
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
              <p className="text-gray-400 mb-4">You have no completed games</p>
              <Button 
                onClick={() => router.push("/")} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-[0_4px_10px_rgba(124,58,237,0.3)]"
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
              <p className="text-gray-400">You have no cancelled games</p>
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