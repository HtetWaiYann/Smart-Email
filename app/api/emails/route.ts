import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET() {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "google" },
        },
      },
    });

    if (!dbUser || !dbUser.accounts.length) {
      return NextResponse.json(
        { error: "No OAuth account found" },
        { status: 404 }
      );
    }

    const oauthAccount = dbUser.accounts[0];

    // Check if token is expired and refresh if needed
    let accessToken = oauthAccount.accessToken;
    if (new Date() >= oauthAccount.expiresAt) {
      // Token expired, need to refresh
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: oauthAccount.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token || oauthAccount.accessToken;

      // Update token in database
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: accessToken,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : oauthAccount.expiresAt,
        },
      });
    }

    // Initialize Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch latest 10 messages from inbox
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "in:inbox",
    });

    const messages = response.data.messages || [];

    // Fetch full message details
    const emailPromises = messages.map(async (message) => {
      const messageDetail = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      });

      const headers = messageDetail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value || "";

      const subject = getHeader("subject");
      const from = getHeader("from");
      const date = getHeader("date");
      const snippet = messageDetail.data.snippet || "";

      // Extract body text
      let bodyText = "";
      const payload = messageDetail.data.payload;
      if (payload?.body?.data) {
        bodyText = Buffer.from(payload.body.data, "base64").toString();
      } else if (payload?.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText = Buffer.from(part.body.data, "base64").toString();
            break;
          }
          if (part.mimeType === "text/html" && part.body?.data && !bodyText) {
            bodyText = Buffer.from(part.body.data, "base64").toString();
          }
        }
      }

      return {
        id: message.id,
        gmailId: message.id!,
        threadId: messageDetail.data.threadId || "",
        subject,
        from,
        snippet,
        body: bodyText,
        receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    });

    const emails = await Promise.all(emailPromises);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
