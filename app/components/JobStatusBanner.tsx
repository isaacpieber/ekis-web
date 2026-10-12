"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

type ActiveJob = {
  id: string;
  source: string;
  week_label: string;
};

const sourceLabels: Record<string, string> = {
  School: "Skola",
  Preschool: "Förskola",
  Other: "Annat",
};

function formatJobDetails(job: ActiveJob) {
  const source = sourceLabels[job.source] ?? job.source;
  const week = job.week_label.replace(/^\d{4}-W/, "Vecka ");

  return `${source} · ${week}`;
}

export default function JobStatusBanner({
  jobs,
  userId,
}: {
  jobs: ActiveJob[];
  userId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const activeJobIds = new Set(jobs.map((job) => job.id));
    let refreshRequested = false;

    function refreshOnce() {
      if (!refreshRequested) {
        refreshRequested = true;
        router.refresh();
      }
    }

    async function recheckJobStatuses() {
      const { data, error } = await supabase
        .from("extraction_jobs")
        .select("id, status")
        .in("id", Array.from(activeJobIds));

      if (error) {
        console.error("Unable to recheck extraction job statuses:", error);
        return;
      }

      if (
        data.some(
          (job) =>
            activeJobIds.has(job.id) &&
            (job.status === "completed" || job.status === "failed"),
        )
      ) {
        refreshOnce();
      }
    }

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
            activeJobIds.has(id) &&
            (status === "completed" || status === "failed")
          ) {
            refreshOnce();
          }
        },
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          void recheckJobStatuses();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Supabase Realtime subscription failed:", error);
        }
      });

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
