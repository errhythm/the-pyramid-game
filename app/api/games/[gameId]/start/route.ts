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
    const { timeLimit } = await req.json();
    
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
        { error: "Only the host can start the game" },
        { status: 403 }
      );
    }
    
    // Check if the game is already started
    if (game.status !== "WAITING") {
      return NextResponse.json(
        { error: "Game has already started or ended" },
        { status: 400 }
      );
    }
    
    // Check if there are enough participants (at least 2)
    if (game.participants.length < 2) {
      return NextResponse.json(
        { error: "At least 2 participants are required to start the game" },
        { status: 400 }
      );
    }
    
    // Calculate end time based on time limit
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (timeLimit || game.timeLimit));
    
    // Update the game status
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "ACTIVE",
        startTime,
        endTime,
        timeLimit: timeLimit || game.timeLimit,
      },
    });
    
    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 