"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthTestPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email || "");
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function signInWithMagicLink() {
    setMessage("送信中...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/auth-test",
      },
    });

    if (error) {
      setMessage("エラー: " + error.message);
      return;
    }

    setMessage("メールを送信しました。メール内のリンクを押してください。");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail("");
    setMessage("ログアウトしました。");
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h1>Supabase ログインテスト</h1>

      <p>今ログインしているユーザー:</p>
      <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
        {userEmail || "未ログイン"}
      </pre>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          type="email"
          placeholder="メールアドレスを入力"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <button
          onClick={signInWithMagicLink}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ログインメールを送る
        </button>

        <button
          onClick={signOut}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ログアウト
        </button>
      </div>

      <p style={{ marginTop: 16, color: "#374151" }}>{message}</p>
    </main>
  );
}
