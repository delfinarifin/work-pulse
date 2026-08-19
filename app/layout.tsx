import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getCurrentConsultant } from "@/lib/data/consultants";
import "./globals.css";

export const metadata: Metadata = {
  title: "Work Pulse",
  description: "Auto-captured consultant time tracking and reporting.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const consultant = user ? await getCurrentConsultant() : null;
  const isManagerOrAdmin = consultant?.role === "manager" || consultant?.role === "admin";

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="md:flex md:min-h-screen">
          <Sidebar userEmail={user?.email ?? null} isManagerOrAdmin={isManagerOrAdmin} />
          <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
