"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type PendingJob = {
  id: string;
  source: string;
  week_label: string;
};

const sourceLabels: Record<string, string> = {
  School: "Skola",
  Preschool: "Förskola",
  Other: "Annat",
};

function formatJobDetails(job: PendingJob) {
  const source = sourceLabels[job.source] ?? job.source;
  const week = job.week_label.replace(/^\d{4}-W/, "Vecka ");

  return `${source} · ${week}`;
}

export default function JobStatusBanner({
  jobs,
  userId,
}: {
  jobs: PendingJob[];
  userId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const pendingJobIds = new Set(jobs.map((job) => job.id));
    const channel = supabase
      .channel(`extraction-jobs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "extraction_jobs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const { id, status } = payload.new;
          if (
            pendingJobIds.has(id) &&
            (status === "completed" || status === "failed")
          ) {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [jobs, router, userId]);

  const message =
    jobs.length > 1
      ? `Bearbetar ${jobs.length} veckobrev i bakgrunden...`
      : "Extraherar händelser i bakgrunden...";

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm animate-pulse"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-primary animate-ping"
      />
      <div className="min-w-0">
        <p className="font-medium text-text-main">{message}</p>
        <p className="text-sm text-text-muted">
          {jobs.map(formatJobDetails).join(", ")}
        </p>
      </div>
    </div>
  );
}
