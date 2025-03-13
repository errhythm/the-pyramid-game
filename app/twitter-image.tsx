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
            Join the ultimate social ranking game
          </p>
        </div>

        {/* Game Stats */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: '#94A3B8',
              }}
            >
              Inspired by
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#E2E8F0',
                fontWeight: 'bold',
              }}
            >
              Korean Drama
            </div>
          </div>
          <div
            style={{
              width: '2px',
              height: '80px',
              background: 'rgba(148, 163, 184, 0.2)',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: '#94A3B8',
              }}
            >
              Ranks
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#E2E8F0',
                fontWeight: 'bold',
              }}
            >
              A to F
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 