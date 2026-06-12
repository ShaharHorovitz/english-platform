"use client";

import * as React from "react";
import { Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { signOutAction } from "@/lib/actions";

const triggerClasses =
  "flex items-center rounded-full p-0.5 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer";

function Identity({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} className="size-10" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

export function ProfileMenu({ name, email }: { name: string; email: string }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger aria-label="Open profile menu" className={triggerClasses}>
          <Avatar name={name} />
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">Profile menu</SheetTitle>
          <div className="px-1 pb-3">
            <Identity name={name} email={email} />
          </div>
          <div className="-mx-4 mb-2 h-px bg-border" />
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-input)] px-3 text-sm font-medium text-muted-foreground opacity-60"
          >
            <Settings className="size-5" />
            Settings
            <span className="ms-auto text-xs">Soon</span>
          </button>
          <form action={signOutAction}>
            <SheetClose asChild>
              <button
                type="submit"
                className="flex h-12 w-full items-center gap-3 rounded-[var(--radius-input)] px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="size-5" />
                Sign out
              </button>
            </SheetClose>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open profile menu" className={triggerClasses}>
        <Avatar name={name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <Identity name={name} email={email} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings />
          Settings
          <span className="ms-auto text-xs font-normal text-muted-foreground">
            Soon
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-start">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
