"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/activities/new", label: "Log Activity" },
  { href: "/timesheets", label: "My Timesheets" },
  { href: "/reports", label: "Reports" },
];

export default function Sidebar() {
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
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
      )}

      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:min-h-screen md:px-3 md:py-6">
        <div className="px-3 pb-6 font-semibold tracking-tight text-lg">
          Work Pulse
        </div>
        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
  );
}
