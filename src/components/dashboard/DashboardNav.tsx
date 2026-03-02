"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV_LINKS } from "@/lib/constants";

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {DASHBOARD_NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-silk text-ink"
                : "text-gray hover:text-ink hover:bg-silk/50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
