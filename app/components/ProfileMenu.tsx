"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CalendarSubscribeButton from "@/app/components/CalendarSubscribeButton";
import { createClient } from "@/utils/supabase/client";

export default function ProfileMenu({
  initial,
  calendarToken,
}: {
  initial: string;
  calendarToken?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLogoutError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`Öppna profilmenyn, ${initial}`}
        aria-expanded={isOpen}
        aria-controls="profile-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-surface-dark font-bold text-text-main transition-opacity hover:opacity-80 focus:ring-2 focus:ring-primary focus:outline-none"
      >
        {initial}
      </button>
      {isOpen && (
        <div
          id="profile-menu"
          className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-surface-dark bg-surface p-1 shadow-md"
        >
          {calendarToken && <CalendarSubscribeButton token={calendarToken} />}
          {logoutError && (
            <p role="alert" className="px-4 py-2 text-sm text-text-muted">
              {logoutError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left font-medium text-text-main transition-colors hover:bg-surface-dark focus:ring-2 focus:ring-primary focus:outline-none"
          >
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
