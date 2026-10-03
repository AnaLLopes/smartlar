"use client";

import { useState } from "react";
import { Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
        <Home className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-semibold tracking-tight">SmartLar</p>
        <p className="text-xs text-muted-foreground">Automação residencial</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r bg-sidebar p-5 md:flex">
        <Marca />
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setAberto(true)}
          >
            <Menu className="size-4" />
          </Button>
          <Marca />
        </header>
        <Sheet open={aberto} onOpenChange={setAberto}>
          <SheetContent side="left" className="w-72 gap-6 p-5">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Marca />
            </SheetHeader>
            <SidebarNav onNavigate={() => setAberto(false)} />
          </SheetContent>
        </Sheet>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
