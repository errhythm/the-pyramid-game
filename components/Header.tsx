import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Home, History, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="h-5 w-5 text-purple-500 group-hover:animate-pulse transition-all duration-300" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-300">
              Pyramid Game
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
              <Home className="h-4 w-4" />
              <span>Home</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/history" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
              <History className="h-4 w-4" />
              <span>History</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{
              elements: {
                avatarBox: "border-2 border-purple-500 hover:border-indigo-500 transition-all duration-300",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
} 