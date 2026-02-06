"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { fetchInboxViaImap } from "@/lib/imap";
import { categorizeEmail } from "@/lib/actions/classifyEmail";

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

export async function processAndStoreEmails() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return { error: "Unauthorized", processed: 0 };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: { where: { provider: "google" } } },
    });

    if (!dbUser || !dbUser.accounts.length) {
      return { error: "No OAuth account found", processed: 0 };
    }

    const fetchedEmails = await fetchInboxViaImap(
      session.user.email,
      dbUser.accounts[0]
    );

    console.log("fetchedEmails", fetchedEmails);

    let processedCount = 0;

    for (const email of fetchedEmails) {
      const existingEmail = await prisma.email.findUnique({
        where: { gmailId: email.gmailId },
      });

      if (existingEmail) {
        console.log("existingEmail - skipping", existingEmail);
        continue;
      }

      const categorizationResult = await categorizeEmail({
        from: email.from,
        subject: email.subject,
        snippet: email.snippet,
      });

      console.log("categorizationResult", categorizationResult);

      if (!categorizationResult.ok) {
        continue;
      }

      await prisma.email.create({
        data: {
          userId: dbUser.id,
          gmailId: email.gmailId,
          threadId: email.threadId || email.gmailId,
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          receivedAt: new Date(email.receivedAt),
          category: categorizationResult.result.category as
            | "ACTION"
            | "MEETING"
            | "INFO"
            | "NOISE",
          urgency: categorizationResult.result.urgency,
          summary: categorizationResult.result.summary,
          suggestedReply: categorizationResult.result.suggested_reply || null,
        },
      });

      processedCount++;
    }

    return { error: null, processed: processedCount };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to process emails",
      processed: 0,
    };
  }
}

export async function getUserEmails(page: number = 1, limit: number = 10) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return { error: "Unauthorized", emails: [], total: 0 };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return { error: "User not found", emails: [], total: 0 };
    }

    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where: { userId: dbUser.id, archivedAt: null },
        orderBy: { receivedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.email.count({
        where: { userId: dbUser.id, archivedAt: null },
      }),
    ]);

    return { emails, error: null, total };
  } catch {
    return { error: "Failed to fetch emails", emails: [], total: 0 };
  }
}
