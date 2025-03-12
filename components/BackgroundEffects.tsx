"use client";

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Main gradient blobs */}
      <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-gradient-to-r from-violet-900 via-purple-900 to-fuchsia-900 rounded-full mix-blend-normal filter blur-[128px] opacity-20"></div>
      <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-gradient-to-l from-blue-900 via-indigo-900 to-violet-900 rounded-full mix-blend-normal filter blur-[128px] opacity-20"></div>
      <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-gradient-to-tr from-fuchsia-900 via-purple-900 to-violet-900 rounded-full mix-blend-normal filter blur-[128px] opacity-20"></div>
      <div className="absolute -bottom-8 right-20 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-900 via-violet-900 to-purple-900 rounded-full mix-blend-normal filter blur-[128px] opacity-20"></div>
      
      {/* Accent blobs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-transparent rounded-full mix-blend-screen filter blur-xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gradient-to-l from-indigo-500/30 to-transparent rounded-full mix-blend-screen filter blur-xl"></div>
      
      {/* Subtle particle effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1)_1px,transparent_1px)] opacity-50" style={{ backgroundSize: '24px 24px' }}></div>
    </div>
  );
} 