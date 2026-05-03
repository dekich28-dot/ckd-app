"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function timeoutPromise(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("通信がタイムアウトしました。時間をおいてもう一度お試しください。"));
    }, ms);
  });
}

export default function LoginPage() {
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

    try {
      const supabase = createClient();

      const result = await Promise.race([
        supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        timeoutPromise(15000),
      ]);

      const { error } = result as { error: { message: string } | null };

      if (error) {
        setErrorMessage(`送信に失敗しました: ${error.message}`);
        return;
      }

      setMessage("メールを送信しました");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "不明なエラーが起きました。";
      setErrorMessage(`送信中にエラーが起きました: ${text}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: "#f5f9ff",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          border: "1px solid #dbeafe",
          borderRadius: "18px",
          padding: "20px",
          background: "#fff",
          boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "#e0f2fe",
            display: "grid",
            placeItems: "center",
            fontSize: "26px",
            marginBottom: "10px",
          }}
        >
          📝
        </div>

        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            margin: "0 0 2px",
            color: "#0f172a",
            lineHeight: 1.25,
          }}
        >
          じいじの腎臓ノート
        </h1>

        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#0369a1",
            marginBottom: "8px",
          }}
        >
          ログイン
        </div>

        <p
          style={{
            color: "#475569",
            margin: "0 0 16px",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          家族用メールアドレスを入力して、ログインメールを受け取ってください。
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="例: family@example.com"
            autoComplete="email"
            style={{
              width: "100%",
              minHeight: "50px",
              padding: "12px 14px",
              borderRadius: "14px",
              border: "1px solid #bfdbfe",
              fontSize: "16px",
              color: "#0f172a",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={isSending}
            style={{
              border: "none",
              borderRadius: "14px",
              minHeight: "50px",
              padding: "12px 14px",
              background: isSending ? "#93c5fd" : "#0284c7",
              color: "white",
              fontWeight: 700,
              fontSize: "16px",
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            {isSending ? "送信中..." : "ログインメールを送る"}
          </button>
        </form>

        {message ? (
          <p
            style={{
              marginTop: "12px",
              color: "#166534",
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "10px 12px",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p
            style={{
              marginTop: "12px",
              color: "#991b1b",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "10px 12px",
              fontSize: "14px",
            }}
          >
            {errorMessage}
          </p>
        ) : null}

        <p
          style={{
            marginTop: "12px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.55,
          }}
        >
          最新のメールを開いてログインしてください。古いメールでは入れないことがあります。
        </p>
      </div>
    </main>
  );
}