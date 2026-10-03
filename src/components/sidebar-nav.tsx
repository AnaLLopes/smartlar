"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        // "/pedidos" não deve ficar ativo em "/pedidos/novo".
        const ativo =
          href === "/"
            ? pathname === "/"
            : pathname === href ||
              (pathname.startsWith(href + "/") &&
                !NAV_ITEMS.some(
                  (o) =>
                    o.href !== href &&
                    o.href.startsWith(href + "/") &&
                    pathname.startsWith(o.href)
                ));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              ativo
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {ativo && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />
            )}
            <Icon
              className={cn(
                "size-[18px] transition-colors",
                ativo ? "text-primary" : "group-hover:text-foreground"
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
