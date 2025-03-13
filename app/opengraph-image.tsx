import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Pyramid Game - Social Ranking Game';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090B', // zinc-950
          backgroundImage: 'radial-gradient(circle at center, rgba(124,58,237,0.15), transparent)',
        }}
      >
        {/* Pyramid Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '24px',
            backgroundColor: '#18181B', // zinc-900
            padding: '20px',
            marginBottom: '40px',
            boxShadow: '0 0 50px rgba(124,58,237,0.2)',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: '20px' }}
          >
            <path
              d="M12 4L3 19H21L12 4Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              background: 'linear-gradient(to bottom right, #E2E8F0, #94A3B8)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: '0 0 20px 0',
              letterSpacing: '-0.05em',
            }}
          >
            The Pyramid Game
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#94A3B8', // zinc-400
              margin: '0',
              opacity: '0.8',
            }}
          >
            A magical journey through the pyramid
          </p>
        </div>

        {/* Rank Badges */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '60px',
          }}
        >
          {['A', 'B', 'C', 'D', 'F'].map((rank) => (
            <div
              key={rank}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: rank === 'A'
                  ? 'linear-gradient(to bottom right, #EAB308, #B45309)'
                  : rank === 'F'
                    ? 'linear-gradient(to bottom right, #DC2626, #7F1D1D)'
                    : 'linear-gradient(to bottom right, #52525B, #27272A)',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Rank {rank}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 