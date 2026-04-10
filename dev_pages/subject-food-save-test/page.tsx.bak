"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SubjectRow = {
  id: string;
  name: string;
};

type FoodRow = {
  id: string;
  subject_name: string;
  name: string;
  base_amount: string;
  kcal: number;
  protein: number;
  sodium: number;
  potassium: number;
  note: string;
};

export default function SubjectFoodSaveTestPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectList, setSubjectList] = useState<SubjectRow[]>([]);

  const [foodSubject, setFoodSubject] = useState("主食");
  const [foodName, setFoodName] = useState("");
  const [baseAmount, setBaseAmount] = useState("1食分");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [sodium, setSodium] = useState("");
  const [potassium, setPotassium] = useState("");
  const [note, setNote] = useState("");
  const [foodList, setFoodList] = useState<FoodRow[]>([]);

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

  async function loadSubjects() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    const { data, error } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      setMessage("科目の読み込みエラー: " + error.message);
      return;
    }

    const rows = (data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    }));

    setSubjectList(rows);
    if (rows.length > 0) setFoodSubject(rows[0].name);
    setMessage("科目を読み込みました。");
  }

  async function saveSubject() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    if (!subjectName.trim()) {
      setMessage("科目名を入れてください。");
      return;
    }

    const { error } = await supabase.from("subjects").insert({
      user_id: userId,
      name: subjectName.trim(),
    });

    if (error) {
      setMessage("科目の保存エラー: " + error.message);
      return;
    }

    setSubjectName("");
    setMessage("科目を保存しました。");
    loadSubjects();
  }

  async function loadFoods() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    const { data, error } = await supabase
      .from("custom_foods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage("食品候補の読み込みエラー: " + error.message);
      return;
    }

    const rows = (data || []).map((row) => ({
      id: String(row.id),
      subject_name: String(row.subject_name),
      name: String(row.name),
      base_amount: row.base_amount ? String(row.base_amount) : "",
      kcal: row.kcal != null ? Number(row.kcal) : 0,
      protein: row.protein != null ? Number(row.protein) : 0,
      sodium: row.sodium != null ? Number(row.sodium) : 0,
      potassium: row.potassium != null ? Number(row.potassium) : 0,
      note: row.note ? String(row.note) : "",
    }));

    setFoodList(rows);
    setMessage("食品候補を読み込みました。");
  }

  async function saveFood() {
    if (!userId) {
      setMessage("未ログインです。/auth-test でログインしてください。");
      return;
    }

    if (!foodName.trim()) {
      setMessage("食品名を入れてください。");
      return;
    }

    const { error } = await supabase.from("custom_foods").insert({
      user_id: userId,
      subject_name: foodSubject || "その他",
      name: foodName.trim(),
      base_amount: baseAmount || "1食分",
      kcal: kcal ? Number(kcal) : 0,
      protein: protein ? Number(protein) : 0,
      sodium: sodium ? Number(sodium) : 0,
      potassium: potassium ? Number(potassium) : 0,
      note: note || null,
    });

    if (error) {
      setMessage("食品候補の保存エラー: " + error.message);
      return;
    }

    setFoodName("");
    setBaseAmount("1食分");
    setKcal("");
    setProtein("");
    setSodium("");
    setPotassium("");
    setNote("");
    setMessage("食品候補を保存しました。");
    loadFoods();
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 860, margin: "0 auto" }}>
      <h1>科目と食品候補の保存テスト</h1>

      <p>ログイン中のメールアドレス</p>
      <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
        {userEmail || "未ログイン"}
      </pre>

      <section style={{ marginTop: 24, border: "1px solid #d1d5db", borderRadius: 12, padding: 16 }}>
        <h2>科目の保存テスト</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="科目名 例: 主食"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={saveSubject}
              style={{ padding: 12, borderRadius: 8, border: "none", background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              科目を保存
            </button>

            <button
              onClick={loadSubjects}
              style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db", background: "white", fontWeight: 700, cursor: "pointer" }}
            >
              科目を読み込む
            </button>
          </div>

          <div>
            <strong>保存済みの科目</strong>
            <ul>
              {subjectList.map((row) => (
                <li key={row.id}>{row.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24, border: "1px solid #d1d5db", borderRadius: 12, padding: 16 }}>
        <h2>食品候補の保存テスト</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <select
            value={foodSubject}
            onChange={(e) => setFoodSubject(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            {subjectList.length === 0 ? (
              <option>主食</option>
            ) : (
              subjectList.map((row) => (
                <option key={row.id} value={row.name}>
                  {row.name}
                </option>
              ))
            )}
          </select>

          <input
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="食品名"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="基本量"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="カロリー"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="たんぱく質"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={sodium}
            onChange={(e) => setSodium(e.target.value)}
            placeholder="ナトリウム"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={potassium}
            onChange={(e) => setPotassium(e.target.value)}
            placeholder="カリウム"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="メモ"
            style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={saveFood}
              style={{ padding: 12, borderRadius: 8, border: "none", background: "#16a34a", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              食品候補を保存
            </button>

            <button
              onClick={loadFoods}
              style={{ padding: 12, borderRadius: 8, border: "1px solid #d1d5db", background: "white", fontWeight: 700, cursor: "pointer" }}
            >
              食品候補を読み込む
            </button>
          </div>

          <div>
            <strong>保存済みの食品候補</strong>
            <ul>
              {foodList.map((row) => (
                <li key={row.id}>
                  [{row.subject_name}] {row.name} / {row.base_amount} / {row.kcal} kcal / {row.protein} g / Na {row.sodium} mg / K {row.potassium} mg
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p style={{ marginTop: 16, color: "#374151" }}>{message}</p>
    </main>
  );
}
