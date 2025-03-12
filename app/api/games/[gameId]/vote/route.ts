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
    const { votes } = await req.json();
    
    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { error: "Votes are required" },
        { status: 400 }
      );
    }
    
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
    
    // Check if the game is active
    if (game.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Game is not active" },
        { status: 400 }
      );
    }
    
    // Check if the user is a participant
    const participant = game.participants.find(
      (p: { userId: string }) => p.userId === userId
    );
    
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this game" },
        { status: 400 }
      );
    }
    
    // Check if the user has already voted
    if (participant.status === "VOTED") {
      return NextResponse.json(
        { error: "You have already voted" },
        { status: 400 }
      );
    }
    
    // Calculate maximum allowed votes based on participant count
    const calculateMaxVotes = (totalParticipants: number) => {
      const twentyPercent = Math.ceil(totalParticipants * 0.2);
      return Math.min(5, Math.max(1, twentyPercent));
    };

    const maxAllowedVotes = calculateMaxVotes(game.participants.length);
    
    // Validate votes
    if (votes.length > maxAllowedVotes) {
      return NextResponse.json(
        { error: `You can only vote for up to ${maxAllowedVotes} participant${maxAllowedVotes === 1 ? '' : 's'} (20% of total participants)` },
        { status: 400 }
      );
    }
    
    // Check for duplicate votes
    const uniqueVoteIds = new Set(votes.map((v: { toUserId: string }) => v.toUserId));
    if (uniqueVoteIds.size !== votes.length) {
      return NextResponse.json(
        { error: "You cannot vote for the same participant multiple times" },
        { status: 400 }
      );
    }
    
    // Check if the user is voting for themselves
    if (votes.some((v: { toUserId: string }) => v.toUserId === userId)) {
      return NextResponse.json(
        { error: "You cannot vote for yourself" },
        { status: 400 }
      );
    }
    
    // Check if all voted users are participants
    const participantIds = game.participants.map((p: { userId: string }) => p.userId);
    const allVotedUsersAreParticipants = votes.every(
      (v: { toUserId: string }) => participantIds.includes(v.toUserId)
    );
    
    if (!allVotedUsersAreParticipants) {
      return NextResponse.json(
        { error: "You can only vote for participants in this game" },
        { status: 400 }
      );
    }
    
    // Get the participant IDs for the votes
    const participantsMap = new Map(
      game.participants.map((p: { userId: string; id: string }) => [p.userId, p.id])
    );
    
    // Create the votes
    const votePromises = votes.map((vote: { toUserId: string }) => {
      return prisma.vote.create({
        data: {
          gameId,
          fromUserId: userId,
          toUserId: vote.toUserId,
          fromParticipantId: participant.id,
          toParticipantId: participantsMap.get(vote.toUserId) as string,
        },
      });
    });
    
    await Promise.all(votePromises);
    
    // Update the participant status
    await prisma.participant.update({
      where: { id: participant.id },
      data: { status: "VOTED" },
    });
    
    // Update vote counts for each participant who received votes
    for (const vote of votes) {
      const toParticipantId = participantsMap.get(vote.toUserId);
      if (toParticipantId) {
        await prisma.participant.update({
          where: { id: toParticipantId },
          data: {
            voteCount: {
              increment: 1,
            },
          },
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting votes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 