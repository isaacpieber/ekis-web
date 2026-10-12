import Header from "@/app/components/Header";
import JobStatusBanner from "@/app/components/JobStatusBanner";
import UpcomingEvents from "@/app/components/UpcomingEvents";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `Det gick inte att verifiera användaren: ${userError.message}`,
    );
  }

  let activeJobs = null;
  if (user) {
    const { data, error } = await supabase
      .from("extraction_jobs")
      .select("id, week_label, source")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"]);

    if (error) {
      throw new Error(
        `Det gick inte att läsa extraktionsjobb: ${error.message}`,
      );
    }

    activeJobs = data;
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Header title="Kommande händelser" />
      {user && activeJobs && activeJobs.length > 0 && (
        <JobStatusBanner jobs={activeJobs} userId={user.id} />
      )}
      <UpcomingEvents />
    </main>
  );
}
