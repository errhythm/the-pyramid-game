import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Rank = "A" | "B" | "C" | "D" | "F";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This endpoint should be called by a cron job every minute
export async function GET() {
  try {
    // Find active games that have reached their end time
    const now = new Date();
    const expiredGames = await prisma.game.findMany({
      where: {
        status: "ACTIVE",
        endTime: {
          lte: now,
        },
      },
      include: {
        participants: true,
      },
    });
    
    if (expiredGames.length === 0) {
      return NextResponse.json({ message: "No expired games found" });
    }
    
    const completedGames = [];
    
    // Process each expired game
    for (const game of expiredGames) {
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
        where: { gameId: game.id },
        orderBy: { voteCount: "desc" },
      });
      
      const totalVotes = participants.reduce(
        (sum, p) => sum + (p.voteCount || 0),
        0
      );
      
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
        let rank: Rank = "F";
        
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
          data: { rank },
        });
      }
      
      // Update game status
      const updatedGame = await prisma.game.update({
        where: { id: game.id },
        data: {
          status: "COMPLETED",
        },
      });
      
      completedGames.push(updatedGame);
    }
    
    return NextResponse.json({
      message: `Completed ${completedGames.length} expired games`,
      games: completedGames,
    });
  } catch (error) {
    console.error("Error completing expired games:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 