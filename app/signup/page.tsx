
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              roll_number: rollNumber.trim(),
            },
            emailRedirectTo:
              `${window.location.origin}/auth/callback?next=/student`,
          },
        });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.session) {
        const response = await fetch("/api/auth/provision", {
          method: "POST",
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          setError(
            result.error ??
            "Account bana, lekin student profile setup nahi ho saka."
          );
          return;
        }

        router.replace("/student");
        router.refresh();
        return;
      }

      setMessage(
        "Signup request successful. Apna email check karein aur verification link par click karein."
      );
    } catch {
      setError("Account create nahi hua. Please dobara try karein.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-medium text-blue-700">
          ← Home
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Scholarship Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your details to create a student account.
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="rollNumber" className="mb-2 block text-sm font-medium text-slate-700">
              Student roll number
            </label>
            <input
              id="rollNumber"
              type="text"
              autoComplete="off"
              required
              maxLength={50}
              value={rollNumber}
              onChange={(event) => setRollNumber(event.target.value)}
              placeholder="Enter your roll number"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create student account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
