"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, LogIn, Triangle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

interface Game {
  id: string;
  code: string;
  title: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function HomePageClient() {
  const router = useRouter();
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
  
  // Memoize form default values
  const defaultValues = useMemo(() => ({
    title: "",
  }), []);
  
  // Create game form
  const createForm = useForm({
    defaultValues,
  });
  
  // Memoize handlers
  const onCreateSubmit = useCallback(async (data: { title: string }) => {
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
  }, [router]);
  
  const handleCodeChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste event - take first 6 characters and distribute them
      const pastedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const newGameCode = [...gameCode];
      
      // Fill all positions with pasted characters
      for (let i = 0; i < 6; i++) {
        newGameCode[i] = pastedValue[i] || '';
      }
      
      setGameCode(newGameCode);
      
      // Focus the last filled input or the next empty one
      const lastFilledIndex = Math.min(pastedValue.length - 1, 5);
      const nextIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : lastFilledIndex;
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
  }, [gameCode]);
  
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !gameCode[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  }, [gameCode]);
  
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    // Prevent the default paste behavior
    e.preventDefault();
    
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    
    // Create new game code array with pasted content
    const newGameCode = Array(6).fill('').map((_, i) => cleanedText[i] || '');
    setGameCode(newGameCode);
    
    // Focus the appropriate input
    const nextEmptyIndex = newGameCode.findIndex(char => !char);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs[focusIndex]?.current?.focus();
  }, []);
  
  const handleJoinSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [gameCode, router]);

  // Memoize the game code input fields
  const gameCodeInputs = useMemo(() => (
    gameCode.map((digit, index) => (
      <Input
        key={index}
        ref={inputRefs[index]}
        type="text"
        value={digit}
        onChange={(e) => handleCodeChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        className="w-12 h-12 text-center font-['JetBrains_Mono'] text-2xl font-bold uppercase text-white border-gray-800 focus:border-purple-500 focus:ring-purple-500/20 p-2"
        maxLength={1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    ))
  ), [gameCode, handleCodeChange, handleKeyDown, handlePaste]);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <Triangle className="h-8 w-8 text-purple-400" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white">
            The Pyramid Game
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Create or join a game to start ranking participants in a unique and engaging way
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Game Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="h-full flex flex-col">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl text-white">
                Create a New Game
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Set up a new Pyramid Game and invite others to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 pt-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-200 block">
                  Game Title
                </label>
                <Input
                  {...createForm.register("title", { required: true })}
                  className="bg-zinc-800/50 border-zinc-700 text-white h-11"
                  placeholder="Enter a title for your game"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-purple-600 hover:bg-purple-700 h-11"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? "Creating..." : "Create Game"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Join Game Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <form onSubmit={handleJoinSubmit} className="h-full flex flex-col">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl text-white">
                Join a Game
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter the 6-digit game code to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 pt-2">
              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-200 block">
                  Game Code
                </label>
                <div className="flex gap-3 justify-center">
                  {gameCodeInputs}
                </div>
                <p className="text-xs text-zinc-400 text-center">
                  Enter any combination of letters and numbers
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button
                type="submit"
                disabled={isJoining || gameCode.join('').length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-700 h-11"
              >
                <LogIn className="w-4 h-4 mr-2" />
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