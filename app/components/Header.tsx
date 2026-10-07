"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ProfileMenu from "./ProfileMenu";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  first_name: string | null;
  calendar_token: string | null;
};

export default function Header({
  title,
  backLink,
}: {
  title: string;
  backLink?: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Kunde inte verifiera användaren: ${userError.message}`);
      }

      if (!user) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      const { data: profileData, error: profileFetchError } = await supabase
        .from("profiles")
        .select("first_name, calendar_token")
        .eq("id", user.id)
        .maybeSingle();

      if (profileFetchError) {
        throw new Error(
          `Kunde inte läsa in profilen: ${profileFetchError.message}`,
        );
      }

      if (isMounted) {
        setProfile(profileData);
      }
    }

    void loadProfile().catch((error: unknown) => {
      if (isMounted) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Kunde inte läsa in profilen.",
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const initial = profile?.first_name
    ? profile.first_name.charAt(0).toUpperCase()
    : "E";

  return (
    <>
      <header className="mb-6 flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          {backLink && (
            <Link
              href={backLink}
              aria-label="Tillbaka"
              className="flex min-h-11 min-w-11 -ml-2 items-center justify-center text-text-muted transition-colors hover:text-text-main focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="sr-only">Tillbaka</span>
            </Link>
          )}
          <h1 id="page-title" className="text-xl font-semibold text-text-main">
            {title}
          </h1>
        </div>
        <ProfileMenu
          initial={initial}
          calendarToken={profile?.calendar_token}
        />
      </header>
      {profileError && (
        <p role="alert" className="mb-4 text-sm text-text-muted">
          {profileError}
        </p>
      )}
    </>
  );
}
