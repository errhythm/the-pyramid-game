'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  top: string;
  left: string;
  duration: string;
}

export function AuthBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 10 + 5}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* Magical background effects */}
      <div className="absolute inset-0 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(120,120,128,0.15),transparent_100%)]" />
        <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_0%,rgba(120,120,128,0.05),transparent_25%,transparent_75%,rgba(120,120,128,0.05))]" />
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute h-1 w-1 rounded-full bg-zinc-400/20"
              style={{
                top: particle.top,
                left: particle.left,
                animation: `float ${particle.duration} linear infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-100vh) rotate(360deg); }
        }
      `}</style>
    </>
  );
} 