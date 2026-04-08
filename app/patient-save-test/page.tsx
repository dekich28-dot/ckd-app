"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PatientSaveTestPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [egfr, setEgfr] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPatient();
  }, []);

  async function loadPatient() {
    setMessage("読み込み中...");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (sessionError || !user) {
      setMessage("未ログインです。先に /auth-test でログインしてください。");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      setMessage("読み込みエラー: " + error.message);
      return;
    }

    if (data) {
      setPatientId(data.id || "");
      setName(data.name || "");
      setAge(data.age ? String(data.age) : "");
      setEgfr(data.egfr ? String(data.egfr) : "");
      setMessage("既存データを読み込みました。");
    } else {
      setMessage("まだ保存データはありません。");
    }
  }

  async function savePatient() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログイン後、少し待ってから再読み込みしてください。");
      return;
    }

    setMessage("保存中...");

    if (patientId) {
      const { error } = await supabase
        .from("patients")
        .update({
          name: name || null,
          age: age ? Number(age) : null,
          egfr: egfr ? Number(egfr) : null,
        })
        .eq("id", patientId)
        .eq("user_id", userId);

      if (error) {
        setMessage("更新エラー: " + error.message);
        return;
      }

      setMessage("更新できました。");
      return;
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        user_id: userId,
        name: name || null,
        age: age ? Number(age) : null,
        egfr: egfr ? Number(egfr) : null,
      })
      .select()
      .single();

    if (error) {
      setMessage("保存エラー: " + error.message);
      return;
    }

    setPatientId(data.id || "");
    setMessage("新しく保存できました。");
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1>患者情報の保存テスト</h1>

      <p>ログイン中のメールアドレス</p>
      <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
        {userEmail || "未ログイン"}
      </pre>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="患者名"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="年齢"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />
        <input
          value={egfr}
          onChange={(e) => setEgfr(e.target.value)}
          placeholder="eGFR"
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadPatient}
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
            onClick={savePatient}
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
