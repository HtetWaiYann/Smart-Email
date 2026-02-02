"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { fetchInboxViaImap } from "@/lib/imap";

export async function fetchInboxEmails() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return { error: "Unauthorized", emails: [] };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: { where: { provider: "google" } } },
    });

    if (!dbUser || !dbUser.accounts.length) {
      return { error: "No OAuth account found", emails: [] };
    }

    const emails = await fetchInboxViaImap(session.user.email, dbUser.accounts[0]);
    return { emails, error: null };
  } catch {
    return { error: "Failed to fetch emails", emails: [] };
  }
}

export async function getUserEmails() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return { error: "Unauthorized", emails: [] };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return { error: "User not found", emails: [] };
    }

    const emails = await prisma.email.findMany({
      where: { userId: dbUser.id, archivedAt: null },
      orderBy: { receivedAt: "desc" },
      take: 10,
    });

    return { emails, error: null };
  } catch {
    return { error: "Failed to fetch emails", emails: [] };
  }
}
