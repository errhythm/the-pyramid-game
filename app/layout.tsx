import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "The Pyramid Game",
  description: "A magical journey through the pyramid",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-zinc-950`}>
          {/* Fixed background elements */}
          <div className="fixed inset-0">
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-noise"></div>
            
            {/* Background gradient effects */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-conic from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-slow-spin"></div>
              <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-3xl"></div>
            </div>

            {/* Floating particles */}
            <BackgroundParticles />
          </div>

          {/* Scrollable content */}
          <div className="relative min-h-screen">
            {children}
          </div>

          <ToasterProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
