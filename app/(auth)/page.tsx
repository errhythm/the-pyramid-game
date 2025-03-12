"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, LogIn } from "lucide-react";

interface Game {
  id: string;
  code: string;
  title: string;
  timeLimit: number;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Create game form
  const createForm = useForm({
    defaultValues: {
      title: "",
      timeLimit: 30,
    },
  });
  
  // Join game form
  const joinForm = useForm({
    defaultValues: {
      code: "",
    },
  });
  
  // Handle create game
  const onCreateSubmit = async (data: { title: string; timeLimit: number }) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const game = await response.json();
      
      if (!response.ok) {
        throw new Error(game.error || "Failed to create game");
      }
      
      toast.success("Game created successfully!");
      router.push(`/games/${game.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle join game
  const onJoinSubmit = async (data: { code: string }) => {
    setIsJoining(true);
    try {
      const response = await fetch("/api/games/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to join game");
      }
      
      // Find the game by code to get the game ID
      const gamesResponse = await fetch("/api/games");
      const games = await gamesResponse.json();
      const game = games.find((g: Game) => g.code === data.code);
      
      if (!game) {
        throw new Error("Game not found");
      }
      
      toast.success("Joined game successfully!");
      router.push(`/games/${game.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Welcome to Pyramid Game
        </h1>
        <p className="text-gray-400 mt-2">
          Create a new game or join an existing one
        </p>
      </div>
      
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="create">Create Game</TabsTrigger>
          <TabsTrigger value="join">Join Game</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
              <CardHeader>
                <CardTitle>Create a New Game</CardTitle>
                <CardDescription>
                  Start a new Pyramid Game and invite others to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Game Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your game"
                    {...createForm.register("title", { required: true })}
                  />
                  {createForm.formState.errors.title && (
                    <p className="text-red-500 text-sm">Title is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="timeLimit" className="text-sm font-medium">
                    Time Limit (minutes)
                  </label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    max={120}
                    {...createForm.register("timeLimit", {
                      required: true,
                      min: 5,
                      max: 120,
                      valueAsNumber: true,
                    })}
                  />
                  {createForm.formState.errors.timeLimit && (
                    <p className="text-red-500 text-sm">
                      Time limit must be between 5 and 120 minutes
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Create Game
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="join">
          <Card className="border-gray-800 bg-black/50 backdrop-blur-sm">
            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)}>
              <CardHeader>
                <CardTitle>Join a Game</CardTitle>
                <CardDescription>
                  Enter a 6-character code to join an existing game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Game Code
                  </label>
                  <Input
                    id="code"
                    placeholder="Enter 6-character code"
                    {...joinForm.register("code", {
                      required: true,
                      pattern: /^[A-Z0-9]{6}$/,
                    })}
                    className="uppercase"
                  />
                  {joinForm.formState.errors.code && (
                    <p className="text-red-500 text-sm">
                      Please enter a valid 6-character code
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isJoining}>
                  {isJoining ? (
                    "Joining..."
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Join Game
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 