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

    // Check if the game is active
    if (game.status !== "ACTIVE") {
      return NextResponse.json({ error: "Game is not active" }, { status: 400 });
    }

    // Check if the user is a participant
    const participant = game.participants.find(
      (p) => p.userId === userId
    );

    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this game" }, { status: 403 });
    }

    // Check if the user has already voted
    if (participant.status === "VOTED") {
      return NextResponse.json({ error: "You have already voted" }, { status: 400 });
    }

    // Check if the user can only vote for 1 participant
    const maxVotes = Math.min(5, Math.max(1, Math.ceil(game.participants.length * 0.2)));
    if (maxVotes !== 1) {
      return NextResponse.json({ error: "You can only skip voting when you can vote for exactly 1 participant" }, { status: 400 });
    }

    // Mark the participant as voted (with no votes)
    await prisma.participant.update({
      where: { id: participant.id },
      data: { status: "VOTED" },
    });

    return NextResponse.json({ message: "Successfully skipped voting" });
  } catch (error) {
    console.error("Error skipping vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 