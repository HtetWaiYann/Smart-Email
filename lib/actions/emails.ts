"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getUserEmails() {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return { error: "Unauthorized", emails: [] };
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return { error: "User not found", emails: [] };
    }

    // Fetch latest 10 emails from database
    const emails = await prisma.email.findMany({
      where: {
        userId: dbUser.id,
        archivedAt: null,
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 10,
    });

    return { emails, error: null };
  } catch (error) {
    console.error("Error fetching user emails:", error);
    return { error: "Failed to fetch emails", emails: [] };
  }
}
