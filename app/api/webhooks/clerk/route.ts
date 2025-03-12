import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Get the headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured in environment variables");
    return new Response("Webhook secret not configured", {
      status: 500,
    });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the webhook payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url, email_addresses, primary_email_address_id } = evt.data;
    
    // Get primary email
    const primaryEmail = email_addresses?.find(
      (email: any) => email.id === primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      console.error("No primary email found for user:", id);
      return new Response("No primary email found", { status: 400 });
    }
    
    // Upsert user in our database
    try {
      await prisma.user.upsert({
        where: { id: id as string },
        create: {
          id: id as string,
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous User",
          imageUrl: image_url as string || null,
        },
        update: {
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous User",
          imageUrl: image_url as string || null,
        },
      });
      
      return new Response("User synchronized", { status: 200 });
    } catch (error) {
      console.error("Error synchronizing user:", error);
      return new Response("Error synchronizing user", { status: 500 });
    }
  }

  return new Response("Webhook processed", { status: 200 });
} 