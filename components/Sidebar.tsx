"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/activities/new", label: "Log Activity" },
  { href: "/activities", label: "Activity Log" },
  { href: "/engagements", label: "Engagements" },
  { href: "/journal", label: "Work Journal" },
  { href: "/devices", label: "Devices" },
  { href: "/timesheets", label: "My Timesheets" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

const MANAGER_NAV_ITEMS = [
  { href: "/approvals", label: "Approvals" },
  { href: "/profitability", label: "Profitability" },
  { href: "/capacity", label: "Capacity Planning" },
];

export default function Sidebar({
  userEmail,
  isManagerOrAdmin,
}: {
  userEmail: string | null;
  isManagerOrAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <span className="font-semibold tracking-tight">Work Pulse</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          Menu
        </button>
      </header>

      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden border-b border-neutral-200 px-2 py-2"
        >
          <NavLinks
            pathname={pathname}
            userEmail={userEmail}
            isManagerOrAdmin={isManagerOrAdmin}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      )}

      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:min-h-screen md:px-3 md:py-6">
        <div className="px-3 pb-6 font-semibold tracking-tight text-lg">
          Work Pulse
        </div>
        <NavLinks pathname={pathname} userEmail={userEmail} isManagerOrAdmin={isManagerOrAdmin} />
      </aside>
    </>
  );
}

function NavLinks({
  pathname,
  userEmail,
  isManagerOrAdmin,
  onNavigate,
}: {
  pathname: string;
  userEmail: string | null;
  isManagerOrAdmin?: boolean;
  onNavigate?: () => void;
}) {
  if (!userEmail) {
    return (
      <ul className="flex flex-col gap-1">
        <li>
          <Link
            href="/login"
            onClick={onNavigate}
            className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign in
          </Link>
        </li>
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1">
        {[...NAV_ITEMS, ...(isManagerOrAdmin ? MANAGER_NAV_ITEMS : [])].map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-neutral-200 px-3 pt-4 space-y-2">
        <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
