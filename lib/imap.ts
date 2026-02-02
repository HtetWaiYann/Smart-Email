import { ImapFlow } from "imapflow";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const GMAIL_IMAP_HOST = "imap.gmail.com";
const GMAIL_IMAP_PORT = 993;
const MAX_EMAILS = 10;

export interface FetchedEmail {
  id: string;
  gmailId: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  receivedAt: string;
}

async function getValidAccessToken(
  oauthAccount: { accessToken: string; refreshToken: string; expiresAt: Date; id: string }
): Promise<string> {
  let accessToken = oauthAccount.accessToken;
  if (new Date() >= oauthAccount.expiresAt) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: oauthAccount.refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    accessToken = credentials.access_token ?? oauthAccount.accessToken;
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        accessToken,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : oauthAccount.expiresAt,
      },
    });
  }
  return accessToken;
}

/**
 * Fetches inbox emails via Gmail IMAP with XOAUTH2.
 */
export async function fetchInboxViaImap(
  userEmail: string,
  oauthAccount: { accessToken: string; refreshToken: string; expiresAt: Date; id: string }
): Promise<FetchedEmail[]> {
  const accessToken = await getValidAccessToken(oauthAccount);

  const client = new ImapFlow({
    host: GMAIL_IMAP_HOST,
    port: GMAIL_IMAP_PORT,
    secure: true,
    auth: { user: userEmail, accessToken },
    logger: false,
  });

  const emails: FetchedEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const m = client.mailbox;
      const total = m && typeof m === "object" && "exists" in m ? (m as { exists: number }).exists : 0;
      if (total === 0) return [];

      const start = Math.max(1, total - MAX_EMAILS + 1);
      const messages = await client.fetchAll(`${start}:${total}`, {
        envelope: true,
        source: true,
        uid: true,
      });

      for (const msg of messages) {
        const envelope = msg.envelope;
        const subject = Array.isArray(envelope?.subject) ? envelope.subject.join(" ") : (envelope?.subject ?? "");
        const firstFrom = envelope?.from?.[0];
        let from = "";
        if (firstFrom && typeof firstFrom === "object" && "address" in firstFrom) {
          const a = firstFrom as { name?: string | string[]; address?: string };
          const addr = a.address ?? "";
          const name = Array.isArray(a.name) ? a.name.join(" ") : (a.name ?? "");
          from = name ? `${name} <${addr}>` : addr;
        } else if (firstFrom) {
          from = String(firstFrom);
        }
        const date = envelope?.date ? new Date(envelope.date).toISOString() : new Date().toISOString();

        let bodyText = "";
        let snippet = "";
        if (msg.source) {
          const raw = msg.source.toString();
          const bodyMatch = raw.match(/\r\n\r\n([\s\S]*)$/);
          const bodyRaw = bodyMatch ? bodyMatch[1] : raw;
          const plainMatch = bodyRaw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|$)/i);
          const htmlMatch = bodyRaw.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|$)/i);
          if (plainMatch) {
            bodyText = plainMatch[1].replace(/\r\n/g, "\n").trim();
          } else if (htmlMatch) {
            bodyText = htmlMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          } else {
            bodyText = bodyRaw.replace(/\r\n/g, "\n").slice(0, 2000).trim();
          }
          snippet = bodyText.slice(0, 200).trim();
        }

        emails.push({
          id: String(msg.uid),
          gmailId: String(msg.uid),
          threadId: "",
          subject,
          from,
          snippet,
          body: bodyText,
          receivedAt: date,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails.reverse();
}
