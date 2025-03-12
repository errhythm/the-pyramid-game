import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  const { votes } = await req.json();

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

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: "Votes are required" }, { status: 400 });
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

    // Process votes
    for (const vote of votes) {
      // Find the target participant
      const toParticipant = game.participants.find(
        (p) => p.userId === vote.toUserId
      );

      if (!toParticipant) {
        throw new Error("Invalid vote target");
      }

      // Check if vote already exists
      const existingVote = await prisma.vote.findUnique({
        where: {
          gameId_fromParticipantId_toParticipantId: {
            gameId: params.gameId,
            fromParticipantId: participant.id,
            toParticipantId: toParticipant.id
          }
        }
      });

      if (existingVote) {
        continue; // Skip if vote already exists
      }

      await prisma.vote.create({
        data: {
          gameId: params.gameId,
          fromUserId: userId,
          toUserId: vote.toUserId,
          fromParticipantId: participant.id,
          toParticipantId: toParticipant.id
        },
      });
    }

    // Update participant status to VOTED
    await prisma.participant.update({
      where: { id: participant.id },
      data: { status: "VOTED" }
    });

    return NextResponse.json({ message: "Votes recorded successfully" });
  } catch (error) {
    console.error("Error recording votes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 