"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TextFormField } from "@/app/components/FormControls";
import { createClient } from "../../utils/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${String(formData.get("username")).trim()}@pieber.local`,
      password: String(formData.get("password")),
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-surface rounded-xl p-6 shadow-sm border border-surface-dark">
        <h1 className="text-text-main font-bold text-2xl mb-6">Logga in</h1>
        <form onSubmit={handleSubmit}>
          <TextFormField
            id="username"
            name="username"
            label="Användarnamn"
            value={username}
            onChange={setUsername}
            isRequired
            autoComplete="username"
            className="mb-4"
          />

          <TextFormField
            id="password"
            name="password"
            type="password"
            label="Lösenord"
            value={password}
            onChange={setPassword}
            isRequired
            autoComplete="current-password"
          />

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-primary text-white hover:bg-primary-hover font-medium mt-4"
          >
            {isSubmitting ? "Loggar in..." : "Logga in"}
          </button>

          {error && (
            <p role="alert" className="text-text-muted mt-4">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
