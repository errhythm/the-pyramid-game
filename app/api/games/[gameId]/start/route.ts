import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
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
        participants: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if the user is the host
    if (game.hostId !== userId) {
      return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 });
    }

    // Check if the game is already started
    if (game.status !== "WAITING") {
      return NextResponse.json({ error: "Game has already started or ended" }, { status: 400 });
    }

    // Check if there are enough participants (at least 2)
    if (game.participants.length < 2) {
      return NextResponse.json({ error: "Not enough participants to start the game" }, { status: 400 });
    }

    // Start the game
    const updatedGame = await prisma.game.update({
      where: { id: params.gameId },
      data: {
        status: "ACTIVE",
        startTime: new Date(),
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 