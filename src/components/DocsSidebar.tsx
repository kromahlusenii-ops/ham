"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { DOCS_NAV, type DocsNavItem } from "@/lib/constants";

export default function DocsSidebar() {
  const [activeId, setActiveId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track which section is visible via IntersectionObserver
  useEffect(() => {
    const ids = DOCS_NAV.flatMap((item) => [
      item.href.slice(1),
      ...(item.children?.map((c) => c.href.slice(1)) ?? []),
    ]);

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry (topmost visible heading)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setActiveId(id);
      }
      setMobileOpen(false);
    },
    []
  );

  function NavLink({ item, nested = false }: { item: DocsNavItem; nested?: boolean }) {
    const id = item.href.slice(1);
    const isActive = activeId === id;

    return (
      <a
        href={item.href}
        onClick={(e) => handleClick(e, item.href)}
        className={`block border-l-2 transition-colors ${
          nested ? "py-1 pl-6 text-[12px]" : "py-1.5 pl-4 text-[13px]"
        } ${
          isActive
            ? "border-accent font-medium text-accent"
            : "border-transparent text-gray hover:text-ink"
        }`}
      >
        {item.label}
      </a>
    );
  }

  const navContent = (
    <nav className="space-y-1">
      <p className="mb-4 pl-4 font-mono text-[11px] uppercase tracking-widest text-ash">
        Contents
      </p>
      {DOCS_NAV.map((item) => (
        <div key={item.href}>
          <NavLink item={item} />
          {item.children?.map((child) => (
            <NavLink key={child.href} item={child} nested />
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-64 lg:overflow-y-auto lg:border-r lg:border-stone lg:bg-snow lg:py-8 lg:pr-4 lg:pl-6">
        {navContent}
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-stone bg-white p-3 shadow-lg lg:hidden"
        aria-label="Toggle docs navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 overflow-y-auto border-r border-stone bg-snow px-6 py-8 lg:hidden">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
