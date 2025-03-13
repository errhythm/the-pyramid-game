import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { hostId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        participants: {
          select: {
            id: true,
            userId: true,
            status: true,
            rank: true,
            voteCount: true,
            user: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { title } = await req.json();
    
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Ensure user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Get user data from Clerk
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      
      if (!clerkUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Create user in database
      await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || "Anonymous User",
          imageUrl: clerkUser.imageUrl,
        },
      });
    }
    
    // Generate a random 6-character alphanumeric code
    const generateCode = () => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };
    
    // Make sure the code is unique
    let code = generateCode();
    let existingGame = await prisma.game.findUnique({
      where: { code },
    });
    
    while (existingGame) {
      code = generateCode();
      existingGame = await prisma.game.findUnique({
        where: { code },
      });
    }
    
    // Create the game and add the host as a participant
    const game = await prisma.game.create({
      data: {
        title,
        code,
        status: 'WAITING',
        host: {
          connect: {
            id: userId
          }
        },
        participants: {
          create: {
            userId,
            status: "JOINED",
            voteCount: 0
          }
        }
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          }
        },
        participants: {
          select: {
            id: true,
            userId: true,
            status: true,
            rank: true,
            voteCount: true,
            user: {
              select: {
                name: true,
                imageUrl: true,
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            votes: true,
          }
        }
      }
    });
    
    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 