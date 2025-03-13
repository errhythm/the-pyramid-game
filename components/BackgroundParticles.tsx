'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  top: string;
  left: string;
  duration: string;
}

export function BackgroundParticles() {
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