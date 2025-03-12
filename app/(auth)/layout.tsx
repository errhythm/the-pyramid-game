import { Header } from "@/components/Header";
import { ToasterProvider } from "@/components/ToasterProvider";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F] relative overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay"></div>
      
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-conic from-purple-500/10 via-blue-500/10 to-purple-500/10"></div>
      
      <BackgroundEffects />
      
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="backdrop-blur-3xl bg-white/[0.02] rounded-3xl p-8 shadow-2xl border border-white/[0.05] relative overflow-hidden">
          {/* Card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
      
      <ToasterProvider />
    </div>
  );
} 