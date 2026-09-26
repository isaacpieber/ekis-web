"use client";

import { type FormEvent, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(form);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      options: {
        data: {
          first_name: String(formData.get("firstName")),
        },
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="firstName">First Name</label>
      <input id="firstName" name="firstName" required />

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required />

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing up..." : "Sign up"}
      </button>

      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}
    </form>
  );
}
