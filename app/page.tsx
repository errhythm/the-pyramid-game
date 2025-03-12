"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, LogIn, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

interface Game {
  id: string;
  code: string;
  title: string;
  timeLimit: number;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [gameCode, setGameCode] = useState(['', '', '', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);
  
  // Create game form
  const createForm = useForm({
    defaultValues: {
      title: "",
      timeLimit: 30,
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
  
  // Handle game code input change
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste event
      const pastedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').split('');
      const newGameCode = [...gameCode];
      
      pastedValue.forEach((char, i) => {
        if (index + i < 6) {
          newGameCode[index + i] = char;
        }
      });
      
      setGameCode(newGameCode);
      
      // Focus on the appropriate field after paste
      const nextIndex = Math.min(index + pastedValue.length, 5);
      inputRefs[nextIndex]?.current?.focus();
    } else {
      // Handle single character input
      const newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const newGameCode = [...gameCode];
      newGameCode[index] = newValue;
      setGameCode(newGameCode);
      
      if (newValue && index < 5) {
        inputRefs[index + 1]?.current?.focus();
      }
    }
  };
  
  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !gameCode[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };
  
  // Handle join game
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = gameCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter a complete game code');
      return;
    }
    
    setIsJoining(true);
    try {
      const response = await fetch("/api/games/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to join game");
      }
      
      // Find the game by code to get the game ID
      const gamesResponse = await fetch("/api/games");
      const games = await gamesResponse.json();
      const game = games.find((g: Game) => g.code === code);
      
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
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-32 bg-gray-700 rounded"></div>
          <div className="h-4 w-48 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }
  
  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-white/[0.05] shadow-[0_0_25px_rgba(124,58,237,0.2)] cursor-pointer hover:from-purple-500/20 hover:to-indigo-500/20 transition-all duration-300">
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
          The Pyramid Game
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto px-4">
          Create or join a game to start ranking participants in a unique and engaging way
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
        {/* Create Game Card */}
        <Card className="border-gray-800/50 bg-black/30 backdrop-blur-xl shadow-[0_0_25px_rgba(124,58,237,0.1)] relative overflow-hidden h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5"></div>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="relative h-full flex flex-col">
            <CardHeader className="pb-8 px-6 pt-6">
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Create a New Game
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Set up a new Pyramid Game and invite others to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 px-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Game Title</label>
                <Input
                  {...createForm.register("title", { required: true })}
                  className="bg-black/50 border-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all h-12 cursor-text"
                  placeholder="Enter a title for your game"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Time Limit (minutes)</label>
                <Input
                  type="number"
                  {...createForm.register("timeLimit", { 
                    required: true,
                    min: 1,
                    valueAsNumber: true
                  })}
                  className="bg-black/50 border-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all h-12 cursor-text"
                  placeholder="Enter time limit in minutes"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-6 px-6 pb-6">
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-[0_4px_10px_rgba(124,58,237,0.3)] transition-all duration-300 h-12 text-base cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isCreating ? "Creating..." : "Create Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Join Game Card */}
        <Card className="border-gray-800/50 bg-black/30 backdrop-blur-xl shadow-[0_0_25px_rgba(124,58,237,0.1)] relative overflow-hidden h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5"></div>
          <form onSubmit={handleJoinSubmit} className="relative h-full flex flex-col">
            <CardHeader className="pb-8 px-6 pt-6">
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Join a Game
              </CardTitle>
              <CardDescription className="text-gray-400 text-base">
                Enter the 6-digit game code to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 px-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Game Code</label>
                <div className="flex gap-2 justify-center">
                  {gameCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center font-mono text-lg uppercase bg-black/50 border-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all cursor-text p-0"
                      maxLength={6}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Enter any combination of letters and numbers
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-6 px-6 pb-6">
              <Button
                type="submit"
                disabled={isJoining || gameCode.join('').length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-[0_4px_10px_rgba(124,58,237,0.3)] transition-all duration-300 h-12 text-base cursor-pointer disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5 mr-2" />
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  );
}
