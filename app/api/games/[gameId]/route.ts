import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const [{ userId }, params] = await Promise.all([
      auth(),
      context.params
    ]);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params.gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }
    
    // Check if the game exists
    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        participants: {
          select: {
            id: true,
            userId: true,
            status: true,
            rank: true,
            voteCount: true,
            user: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            votes: true,
          },
        },
      },
    });
    
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a participant or the host
    const isParticipant = game.participants.some(
      (p) => p.userId === userId
    );
    const isHost = game.hostId === userId;
    
    if (!isParticipant && !isHost) {
      return NextResponse.json(
        { error: "You are not a participant in this game" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 