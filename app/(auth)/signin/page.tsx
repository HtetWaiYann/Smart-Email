import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import React from "react";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignIn from "@/components/pagespecific/auth/SignIn";


export default async function Page() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <section className="flex items-center justify-center h-screen w-screen px-0">
      <SignIn />
    </section>
  );
}
