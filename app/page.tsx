import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { processAndStoreEmails, getUserEmails } from "@/lib/actions/emails";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/signin");
  }

  await processAndStoreEmails();

  const { emails, error } = await getUserEmails();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session.user.name || session.user.email}
            </h1>
            <p className="mt-2 text-gray-600">
              Here are your latest {emails.length} emails
            </p>
          </div>
          <SignOutButton />
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {emails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No emails found</p>
            <p className="text-gray-400 text-sm mt-2">
              {error
                ? "Unable to fetch emails. Please try again later."
                : "Your inbox is empty or emails are being fetched."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          email.category === "ACTION"
                            ? "bg-red-100 text-red-800"
                            : email.category === "MEETING"
                              ? "bg-blue-100 text-blue-800"
                              : email.category === "INFO"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {email.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Urgency: {email.urgency}/10
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {email.subject || "(No Subject)"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">From: {email.from}</p>
                    <p className="text-gray-700 mb-3">{email.summary}</p>
                    {email.suggestedReply && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">
                          Suggested Reply:
                        </p>
                        <p className="text-sm text-gray-700">{email.suggestedReply}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(email.receivedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
