import ExtractForm from "@/app/components/ExtractForm";
import Header from "@/app/components/Header";

export default function ParentEventsPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <Header title="Extrahera händelse" backLink="/" />
      <ExtractForm />
    </main>
  );
}
