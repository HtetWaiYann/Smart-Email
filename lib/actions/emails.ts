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

    const emails = await fetchInboxViaImap(session.user.email, dbUser.accounts[0], { page: 1, limit: 10 });
    return { emails: emails.emails, error: null };
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
      dbUser.accounts[0],
      { page: 1, limit: 10 }
    );

    console.log("fetchedEmails", fetchedEmails);

    let processedCount = 0;

    for (const email of fetchedEmails.emails) {
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
      include: { accounts: { where: { provider: "google" } } },
    });

    if (!dbUser || !dbUser.accounts.length) {
      return { error: "No OAuth account found", emails: [], total: 0 };
    }

    const { emails: fetchedEmails, total } = await fetchInboxViaImap(
      session.user.email,
      dbUser.accounts[0],
      { page, limit }
    );

    const emailsWithCategories = await Promise.all(
      fetchedEmails.map(async (email) => {
        const existingEmail = await prisma.email.findUnique({
          where: { gmailId: email.gmailId },
        });

        if (existingEmail) {
          return {
            id: existingEmail.id,
            gmailId: existingEmail.gmailId,
            subject: existingEmail.subject,
            from: existingEmail.from,
            receivedAt: existingEmail.receivedAt,
            category: existingEmail.category,
            urgency: existingEmail.urgency,
            summary: existingEmail.summary,
            suggestedReply: existingEmail.suggestedReply,
          };
        }

        const categorizationResult = await categorizeEmail({
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
        });

        if (!categorizationResult.ok) {
          return {
            id: email.id,
            gmailId: email.gmailId,
            subject: email.subject,
            from: email.from,
            receivedAt: new Date(email.receivedAt),
            category: "NOISE" as const,
            urgency: 1,
            summary: email.snippet,
            suggestedReply: null,
          };
        }

        const categorizedEmail = await prisma.email.create({
          data: {
            userId: dbUser.id,
            gmailId: email.gmailId,
            threadId: email.threadId || email.gmailId,
            from: email.from,
            subject: email.subject,
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

        return {
          id: categorizedEmail.id,
          gmailId: categorizedEmail.gmailId,
          subject: categorizedEmail.subject,
          from: categorizedEmail.from,
          receivedAt: categorizedEmail.receivedAt,
          category: categorizedEmail.category,
          urgency: categorizedEmail.urgency,
          summary: categorizedEmail.summary,
          suggestedReply: categorizedEmail.suggestedReply,
        };
      })
    );

    return { emails: emailsWithCategories, error: null, total };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to fetch emails",
      emails: [],
      total: 0,
    };
  }
}
