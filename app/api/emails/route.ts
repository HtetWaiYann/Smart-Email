import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { fetchInboxViaImap } from "@/lib/imap";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
    const emails = await fetchInboxViaImap(session.user.email, oauthAccount);

    return NextResponse.json({ emails });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
