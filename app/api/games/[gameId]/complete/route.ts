import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { gameId } = params;
    
    // Check if the game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true,
      },
    });
    
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the host
    if (game.hostId !== userId) {
      return NextResponse.json(
        { error: "Only the host can complete the game" },
        { status: 403 }
      );
    }
    
    // Check if the game is active
    if (game.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Game is not active" },
        { status: 400 }
      );
    }
    
    // Mark participants who haven't voted as abstained
    const nonVotedParticipants = game.participants.filter(
      (p: { status: string }) => p.status === "JOINED"
    );
    
    for (const participant of nonVotedParticipants) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { status: "ABSTAINED" },
      });
    }
    
    // Calculate rankings
    const participants = await prisma.participant.findMany({
      where: { gameId },
      orderBy: { voteCount: "desc" },
    });
    
    const totalParticipants = participants.length;
    const totalVotes = participants.reduce((sum: number, p: { voteCount: number }) => sum + p.voteCount, 0);
    
    // Calculate thresholds for each rank
    const rankThresholds = {
      A: Math.ceil(totalVotes * 0.75), // 75% of votes
      B: Math.ceil(totalVotes * 0.15), // 15% of votes
      C: Math.ceil(totalVotes * 0.05), // 5% of votes
      D: 1, // At least 1 vote
      F: 0, // No votes or abstained
    };
    
    // Assign ranks
    for (const participant of participants) {
      let rank = "F";
      
      if (participant.voteCount >= rankThresholds.A) {
        rank = "A";
      } else if (participant.voteCount >= rankThresholds.B) {
        rank = "B";
      } else if (participant.voteCount >= rankThresholds.C) {
        rank = "C";
      } else if (participant.voteCount >= rankThresholds.D) {
        rank = "D";
      }
      
      // If participant abstained, they get F regardless of votes
      if (participant.status === "ABSTAINED") {
        rank = "F";
      }
      
      await prisma.participant.update({
        where: { id: participant.id },
        data: { rank: rank as any },
      });
    }
    
    // Update game status
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
    });
    
    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error completing game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 