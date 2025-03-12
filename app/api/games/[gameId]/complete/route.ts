import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type Rank = "A" | "B" | "C" | "D" | "F";

export async function POST(
  request: NextRequest,
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
      return NextResponse.json({ error: "Only the host can complete the game" }, { status: 403 });
    }

    // Check if the game is active
    if (game.status !== "ACTIVE") {
      return NextResponse.json({ error: "Game is not active" }, { status: 400 });
    }

    // Check if at least one participant has voted
    const hasAnyVotes = game.participants.some((p) => p.status === "VOTED");
    if (!hasAnyVotes) {
      return NextResponse.json({ error: "At least one participant must have voted" }, { status: 400 });
    }

    // Mark participants who haven't voted as abstained
    const nonVotedParticipants = game.participants.filter(
      (p) => p.status === "JOINED"
    );

    for (const participant of nonVotedParticipants) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { status: "ABSTAINED" },
      });
    }

    // Calculate rankings
    const participants = await prisma.participant.findMany({
      where: { gameId: params.gameId },
      orderBy: { voteCount: "desc" },
    });

    const totalParticipants = participants.length;
    const totalVotes = participants.reduce((sum, p) => sum + (p.voteCount || 0), 0);

    // Calculate ranks based on relative vote distribution
    const maxVotes = Math.max(...participants.map(p => p.voteCount));

    // Assign ranks
    for (const participant of participants) {
      let rank: Rank = "F";

      // If participant has votes, calculate their rank based on percentage of max votes
      if (participant.voteCount > 0) {
        const votePercentage = (participant.voteCount / maxVotes) * 100;
        
        if (votePercentage >= 80) {
          rank = "A";
        } else if (votePercentage >= 60) {
          rank = "B";
        } else if (votePercentage >= 40) {
          rank = "C";
        } else {
          rank = "D";
        }
      }
      // If participant has no votes, they get F regardless of their voting status

      await prisma.participant.update({
        where: { id: participant.id },
        data: { rank },
      });
    }

    // Update game status
    const updatedGame = await prisma.game.update({
      where: { id: params.gameId },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error completing game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 