"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DailyLogSaveTestPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [totalKcal, setTotalKcal] = useState("");
  const [totalProtein, setTotalProtein] = useState("");
  const [totalSodium, setTotalSodium] = useState("");
  const [totalPotassium, setTotalPotassium] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSessionOnly();
  }, []);

  async function loadSessionOnly() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (error || !user) {
      setMessage("未ログインです。先に /auth-test でログインしてください。");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");
    setMessage("ログインを確認しました。");
  }

  async function loadDailyLog() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    setMessage("読み込み中...");

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", selectedDate)
      .maybeSingle();

    if (error) {
      setMessage("読み込みエラー: " + error.message);
      return;
    }

    if (!data) {
      setMemo("");
      setTotalKcal("");
      setTotalProtein("");
      setTotalSodium("");
      setTotalPotassium("");
      setMessage("この日の保存データはまだありません。");
      return;
    }

    setMemo(data.memo || "");
    setTotalKcal(data.total_kcal ? String(data.total_kcal) : "");
    setTotalProtein(data.total_protein ? String(data.total_protein) : "");
    setTotalSodium(data.total_sodium ? String(data.total_sodium) : "");
    setTotalPotassium(data.total_potassium ? String(data.total_potassium) : "");
    setMessage("この日のデータを読み込みました。");
  }

  async function saveDailyLog() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    setMessage("保存中...");

    const payload = {
      user_id: userId,
      log_date: selectedDate,
      memo: memo || null,
      total_kcal: totalKcal ? Number(totalKcal) : 0,
      total_protein: totalProtein ? Number(totalProtein) : 0,
      total_sodium: totalSodium ? Number(totalSodium) : 0,
      total_potassium: totalPotassium ? Number(totalPotassium) : 0,
    };

    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });

    if (error) {
      setMessage("保存エラー: " + error.message);
      return;
    }

    setMessage("この日の記録を保存できました。");
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 760, margin: "0 auto" }}>
      <h1>日別記録の保存テスト</h1>

      <p>ログイン中のメールアドレス</p>
      <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
        {userEmail || "未ログイン"}
      </pre>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <label>日付</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <input
          value={totalKcal}
          onChange={(e) => setTotalKcal(e.target.value)}
          placeholder="総カロリー"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <input
          value={totalProtein}
          onChange={(e) => setTotalProtein(e.target.value)}
          placeholder="総たんぱく質"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <input
          value={totalSodium}
          onChange={(e) => setTotalSodium(e.target.value)}
          placeholder="総ナトリウム"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <input
          value={totalPotassium}
          onChange={(e) => setTotalPotassium(e.target.value)}
          placeholder="総カリウム"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ"
          style={{ minHeight: 120, padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadDailyLog}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            読み込む
          </button>

          <button
            onClick={saveDailyLog}
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
            保存する
          </button>
        </div>
      </div>

      <p style={{ marginTop: 16, color: "#374151" }}>{message}</p>
    </main>
  );
}
