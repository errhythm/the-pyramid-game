import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json(
        { error: "Game code is required" },
        { status: 400 }
      );
    }
    
    // Find the game by code
    const game = await prisma.game.findUnique({
      where: { code },
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
    
    // Check if the game is already completed
    if (game.status === "COMPLETED" || game.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This game has already ended" },
        { status: 400 }
      );
    }
    
    // Check if the user is already a participant
    const existingParticipant = game.participants.find(
      (p: { userId: string }) => p.userId === userId
    );
    
    if (existingParticipant) {
      return NextResponse.json(
        { error: "You have already joined this game" },
        { status: 400 }
      );
    }
    
    // Get primary email address
    const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    
    if (!primaryEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }
    
    // Ensure user exists in our database
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: primaryEmail,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous User",
        imageUrl: user.imageUrl || null,
      },
      update: {
        email: primaryEmail,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous User",
        imageUrl: user.imageUrl || null,
      },
    });
    
    // Add the user as a participant
    const participant = await prisma.participant.create({
      data: {
        userId,
        gameId: game.id,
        status: "JOINED",
        voteCount: 0,
      },
    });
    
    return NextResponse.json(participant);
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 