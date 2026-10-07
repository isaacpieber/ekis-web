import Header from "@/app/components/Header";
import UpcomingEvents from "@/app/components/UpcomingEvents";

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-4">
      <Header title="Kommande händelser" />
      <UpcomingEvents />
    </main>
  );
}
