import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserEmails } from "@/lib/actions/emails";
import SignOutButton from "@/components/SignOutButton";
import Pagination from "@/components/Pagination";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/signin");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const { emails, error, total } = await getUserEmails(page, limit);

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(startIndex + emails.length - 1, total);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.user.name || session.user.email}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {total > 0
                ? `${startIndex}-${endIndex} of ${total} emails`
                : "No emails"}
            </p>
          </div>
          <SignOutButton />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {emails.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No emails found</p>
            <p className="text-gray-400 text-sm mt-1">
              {error
                ? "Unable to fetch emails. Please try again later."
                : "Your inbox is empty or emails are being fetched."}
            </p>
          </div>
        ) : (
          <>
            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={limit}
            />
            <div className="mt-3 divide-y divide-gray-200">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="py-4 px-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                        email.urgency >= 8
                          ? "bg-red-500 text-white"
                          : email.urgency >= 6
                            ? "bg-accent text-white"
                            : email.urgency >= 4
                              ? "bg-secondary text-white"
                              : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {email.urgency}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            email.category === "ACTION"
                              ? "bg-red-100 text-red-700"
                              : email.category === "MEETING"
                                ? "bg-blue-100 text-blue-700"
                                : email.category === "INFO"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {email.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(email.receivedAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                        {email.subject || "(No Subject)"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {email.from}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {email.summary}
                      </p>
                      {email.suggestedReply && (
                        <div className="mt-2 bg-blue-50 border-l-3 border-blue-400 pl-3 py-2">
                          <p className="text-xs text-blue-700 font-medium">
                            Suggested Reply:
                          </p>
                          <p className="text-sm text-gray-700 mt-0.5">
                            {email.suggestedReply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={limit}
            />
          </>
        )}
      </div>
    </div>
  );
}
