import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest
) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');
  const { votes } = await req.json();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: "Votes are required" }, { status: 400 });
    }

    // Check if the game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId as string },
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
      (p: { userId: string }) => p.userId === userId
    );

    if (!participant) {
      return NextResponse.json({ error: "You are not a participant in this game" }, { status: 403 });
    }

    // Process votes
    for (const vote of votes) {
      await prisma.vote.create({
        data: {
          participantId: participant.id,
          ...vote,
        },
      });
    }

    return NextResponse.json({ message: "Votes recorded successfully" });
  } catch (error) {
    console.error("Error recording votes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 