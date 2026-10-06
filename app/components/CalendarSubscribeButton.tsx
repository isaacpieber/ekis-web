"use client";

import { useEffect, useState } from "react";

type CalendarSubscribeButtonProps = {
  token: string;
};

export default function CalendarSubscribeButton({
  token,
}: CalendarSubscribeButtonProps) {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    setIsAppleDevice(/iPhone|iPad|iPod|Mac/i.test(navigator.userAgent));
  }, []);

  const handleSubscribe = async () => {
    const baseUrl = window.location.host;
    const calendarUrl = `https://${baseUrl}/api/calendar/feed/${token}`;

    if (isAppleDevice) {
      window.location.href = `webcal://${baseUrl}/api/calendar/feed/${token}`;
      return;
    }

    try {
      await navigator.clipboard.writeText(calendarUrl);
      window.alert(
        "Kalenderlänken har kopierats! Klistra in den i inställningarna för Google Kalender eller din valda kalenderapp.",
      );
    } catch (error) {
      console.error("Det gick inte att kopiera kalenderlänken:", error);
      window.alert(
        `Det gick inte att kopiera kalenderlänken. Kopiera den här länken manuellt: ${calendarUrl}`,
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-text-muted transition-colors hover:text-text-main focus:outline-none focus:underline"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
      Prenumerera på kalender
    </button>
  );
}
