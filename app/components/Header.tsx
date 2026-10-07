import Link from "next/link";

import ProfileMenu from "./ProfileMenu";
import { createClient } from "@/utils/supabase/server";

export default async function Header({
  title,
  backLink,
}: {
  title: string;
  backLink?: string;
}) {
  const supabase = await createClient();
  let profile: {
    first_name: string | null;
    calendar_token: string | null;
  } | null = null;
  let errorMessage: string | null = null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    errorMessage = `Kunde inte verifiera användaren: ${userError.message}`;
  } else if (user) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, calendar_token")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      errorMessage = `Kunde inte läsa in profilen: ${profileError.message}`;
    } else {
      profile = data;
    }
  }

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
      {errorMessage && (
        <p role="alert" className="mb-4 text-sm text-text-muted">
          {errorMessage}
        </p>
      )}
    </>
  );
}
