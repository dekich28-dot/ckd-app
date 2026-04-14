"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("メールアドレスを入力してください。");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(`送信に失敗しました: ${error.message}`);
      return;
    }

    setMessage("メールを送信しました");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          background: "#fff",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>ログイン</h1>
        <p style={{ color: "#475569", marginBottom: "16px" }}>
          メールアドレスを入力してログインリンクを受け取ってください。
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
            }}
          />

          <button
            type="submit"
            disabled={isSending}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "10px 14px",
              background: isSending ? "#94a3b8" : "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            {isSending ? "送信中..." : "ログインリンクを送信する"}
          </button>
        </form>

        {message ? <p style={{ marginTop: "12px", color: "#065f46" }}>{message}</p> : null}
        {errorMessage ? <p style={{ marginTop: "12px", color: "#b91c1c" }}>{errorMessage}</p> : null}
      </div>
    </main>
  );
}