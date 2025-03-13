import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Menu, Triangle, Plus, LogIn, History } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:brightness-110"
          >
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 animate-pulse rounded-lg bg-gradient-to-br from-zinc-400 to-zinc-600" />
              <div className="absolute inset-[2px] rounded-lg bg-zinc-900" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Triangle className="w-6 h-6 text-zinc-200" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent">Pyramid</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  asChild
                >
                  <Link href="/games" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>My Games</span>
                  </Link>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 bg-zinc-900/95 backdrop-blur-xl border-zinc-800">
                <div className="flex justify-between space-x-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">My Games</h4>
                    <p className="text-sm text-zinc-400">
                      View your game history and ongoing games
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-zinc-900/95 backdrop-blur-xl border-zinc-800">
              <SheetHeader>
                <SheetTitle className="text-zinc-100">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  asChild
                >
                  <Link href="/host" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Host a Game</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  asChild
                >
                  <Link href="/join" className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>Join a Game</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  asChild
                >
                  <Link href="/games" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>My Games</span>
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-full ring-2 ring-zinc-700 hover:ring-zinc-500 transition-all",
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
} 