"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  photo: string;
  name: string;
  age: string;
  egfr: string;
  dialysis: string;
  highPotassium: string;
  targetKcal: string;
  targetProtein: string;
  targetSodium: string;
  targetPotassium: string;
};

type FoodMasterItem = {
  id: string;
  subject: string;
  name: string;
  baseAmount: string;
  kcal: number;
  protein: number;
  sodium: number;
  potassium: number;
  note?: string;
  isCustom?: boolean;
};

type MealItem = {
  id: string;
  mealType: string;
  foodId: string;
  foodName: string;
  subject: string;
  amountLabel: string;
  servings: number;
  kcal: number;
  protein: number;
  sodium: number;
  potassium: number;
  sourceType: "master" | "package";
};

type DailyLog = {
  date: string;
  items: MealItem[];
  memo: string;
  totalKcal: number;
  totalProtein: number;
  totalSodium: number;
  totalPotassium: number;
};

type VitalEntry = {
  id: string;
  date: string;
  time: string;
  weight: string;
  systolic: string;
  diastolic: string;
};

const PATIENT_KEY = "ckd_patient_v5";
const LOGS_KEY = "ckd_logs_v5";
const VITALS_KEY = "ckd_vitals_v5";
const CUSTOM_FOODS_KEY = "ckd_custom_foods_v2";
const SUBJECTS_KEY = "ckd_subjects_v1";

const baseFoods: FoodMasterItem[] = [
  { id: "rice150", subject: "主食", name: "ごはん", baseAmount: "150g", kcal: 234, protein: 3.8, sodium: 1, potassium: 44 },
  { id: "bread1", subject: "主食", name: "食パン", baseAmount: "1枚", kcal: 156, protein: 5.8, sodium: 280, potassium: 60 },
  { id: "udon1", subject: "主食", name: "うどん", baseAmount: "1玉", kcal: 210, protein: 6.0, sodium: 2, potassium: 90 },
  { id: "egg1", subject: "たんぱく源", name: "卵", baseAmount: "1個", kcal: 76, protein: 6.2, sodium: 70, potassium: 63 },
  { id: "natto1", subject: "たんぱく源", name: "納豆", baseAmount: "1パック", kcal: 90, protein: 7.4, sodium: 2, potassium: 330 },
  { id: "tofu150", subject: "たんぱく源", name: "豆腐", baseAmount: "150g", kcal: 84, protein: 7.4, sodium: 10, potassium: 180 },
  { id: "salmon1", subject: "たんぱく源", name: "焼き鮭", baseAmount: "1切れ", kcal: 140, protein: 22, sodium: 65, potassium: 380 },
  { id: "chicken100", subject: "たんぱく源", name: "鶏むね肉", baseAmount: "100g", kcal: 133, protein: 24.4, sodium: 45, potassium: 330 },
  { id: "milk200", subject: "飲料", name: "牛乳", baseAmount: "200ml", kcal: 122, protein: 6.6, sodium: 84, potassium: 300 },
  { id: "banana1", subject: "果物", name: "バナナ", baseAmount: "1本", kcal: 86, protein: 1.1, sodium: 1, potassium: 360 },
  { id: "appleHalf", subject: "果物", name: "りんご", baseAmount: "1/2個", kcal: 57, protein: 0.2, sodium: 0, potassium: 55 },
  { id: "miso1", subject: "汁物", name: "味噌汁", baseAmount: "1杯", kcal: 36, protein: 2.2, sodium: 700, potassium: 120 },
  { id: "soy5", subject: "調味料", name: "しょうゆ", baseAmount: "小さじ1 (5ml)", kcal: 4, protein: 0.4, sodium: 290, potassium: 13 },
  { id: "mayo10", subject: "調味料", name: "マヨネーズ", baseAmount: "大さじ1/2 (6g)", kcal: 40, protein: 0.1, sodium: 44, potassium: 1 },
  { id: "ketchup15", subject: "調味料", name: "ケチャップ", baseAmount: "大さじ1 (15g)", kcal: 18, protein: 0.3, sodium: 150, potassium: 54 },
  { id: "ponzu15", subject: "調味料", name: "ぽん酢", baseAmount: "大さじ1 (15ml)", kcal: 9, protein: 0.6, sodium: 360, potassium: 24 },
  { id: "mentsuyu15", subject: "調味料", name: "めんつゆ", baseAmount: "大さじ1 (15ml)", kcal: 16, protein: 0.6, sodium: 420, potassium: 23 },
  { id: "salt1", subject: "調味料", name: "食塩", baseAmount: "1g", kcal: 0, protein: 0, sodium: 393, potassium: 0, note: "食塩相当量1g ≒ ナトリウム393mg" },
  { id: "dressing15", subject: "調味料", name: "ドレッシング", baseAmount: "大さじ1 (15g)", kcal: 45, protein: 0.2, sodium: 180, potassium: 8 },
];

const emptyPatient: Patient = {
  photo: "",
  name: "",
  age: "",
  egfr: "",
  dialysis: "なし",
  highPotassium: "なし",
  targetKcal: "",
  targetProtein: "",
  targetSodium: "",
  targetPotassium: "",
};

function todayString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function timeString() {
  return new Date().toTimeString().slice(0, 5);
}

function toNumber(value: string | number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function format1(value: string | number) {
  return Math.round(toNumber(value) * 10) / 10;
}

function formatDate(date: string) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${y}/${m}/${d}`;
}

function getCurrentLog(logs: DailyLog[], date: string): DailyLog {
  return (
    logs.find((log) => log.date === date) || {
      date,
      items: [],
      memo: "",
      totalKcal: 0,
      totalProtein: 0,
      totalSodium: 0,
      totalPotassium: 0,
    }
  );
}

function calculateTotals(items: MealItem[]) {
  return {
    kcal: format1(items.reduce((sum, item) => sum + toNumber(item.kcal), 0)),
    protein: format1(items.reduce((sum, item) => sum + toNumber(item.protein), 0)),
    sodium: format1(items.reduce((sum, item) => sum + toNumber(item.sodium), 0)),
    potassium: format1(items.reduce((sum, item) => sum + toNumber(item.potassium), 0)),
  };
}



function metricStatus(total: number, target: string, mode: "normal" | "upper") {
  const t = toNumber(target);
  if (!t) return { label: "目標未設定", tone: "info", ratio: 0 };

  const ratio = total / t;

  if (mode === "upper") {
    if (ratio <= 0.9) return { label: "目標内", tone: "good", ratio };
    if (ratio <= 1.0) return { label: "上限付近", tone: "warn", ratio };
    return { label: "超過", tone: "danger", ratio };
  }

  if (ratio < 0.8) return { label: "不足", tone: "danger", ratio };
  if (ratio < 0.95) return { label: "やや不足", tone: "warn", ratio };
  if (ratio <= 1.1) return { label: "目標内", tone: "good", ratio };
  return { label: "やや多め", tone: "warn", ratio };
}

function sodiumTargetToMg(target: string) {
  const raw = toNumber(target);
  if (!raw) return 0;
  if (raw <= 20) {
    return format1((raw * 1000) / 2.54);
  }
  return raw;
}

function buildSummaryMessages(
  totals: { kcal: number; protein: number; sodium: number; potassium: number },
  patient: Patient
) {
  const kcalStatus = metricStatus(totals.kcal, patient.targetKcal, "normal");
  const proteinStatus = metricStatus(totals.protein, patient.targetProtein, "normal");
  const sodiumStatus = metricStatus(totals.sodium, String(sodiumTargetToMg(patient.targetSodium)), "upper");
  const potassiumStatus = metricStatus(totals.potassium, patient.targetPotassium, "upper");

  const messages: string[] = [];

if (sodiumStatus.tone === "good") messages.push("ナトリウムは目標内です。");
if (sodiumStatus.tone === "warn") messages.push("ナトリウムは上限に近いです。");
if (sodiumStatus.tone === "danger") messages.push("ナトリウムは目標を超えています。");

  if (kcalStatus.tone !== "good" && proteinStatus.tone !== "good") {
    messages.push("ただし、エネルギーとたんぱく質が少なめです。");
  } else {
    if (kcalStatus.tone === "warn" || kcalStatus.tone === "danger") messages.push("エネルギーが少なめです。");
    if (proteinStatus.tone === "warn" || proteinStatus.tone === "danger") messages.push("たんぱく質が少なめです。");
  }

  if (kcalStatus.tone === "danger" && proteinStatus.tone === "danger") {
    messages.push("制限しすぎの可能性があります。");
  }

  if (potassiumStatus.tone === "warn") messages.push("カリウムは上限に近いです。");
  if (potassiumStatus.tone === "danger") messages.push("カリウムは目標を超えています。");

  if (messages.length === 0) {
    messages.push("本日の摂取量は概ね目標内です。");
  }

  return messages;
}

function last7Dates(endDate: string) {
  const end = new Date(endDate + "T00:00:00");
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getLatestVitalPerDate(vitals: VitalEntry[], dates: string[]) {
  return dates.map((date) => {
    const sameDate = vitals
      .filter((v) => v.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
    const latest = sameDate[sameDate.length - 1];
    return {
      date,
      label: date.slice(5),
      weight: latest ? toNumber(latest.weight) : 0,
      systolic: latest ? toNumber(latest.systolic) : 0,
      diastolic: latest ? toNumber(latest.diastolic) : 0,
    };
  });
}

function formatMonthDayTime(date: string, time: string) {
  const d = date.slice(5);
  const t = (time || "").slice(0, 5);
  return t ? `${d} ${t}` : d;
}

function getRecentVitalSeries(vitals: VitalEntry[], endDate: string) {
  const dates = last7Dates(endDate);
  const startDate = dates[0];

  return [...vitals]
    .filter((v) => v.date >= startDate && v.date <= endDate)
    .sort((a, b) => {
      const av = `${a.date} ${a.time}`;
      const bv = `${b.date} ${b.time}`;
      return av.localeCompare(bv);
    })
    .map((v) => ({
      date: v.date,
      label: formatMonthDayTime(v.date, v.time),
      weight: toNumber(v.weight),
      systolic: toNumber(v.systolic),
      diastolic: toNumber(v.diastolic),
    }));
}

function get7DayLogs(logs: DailyLog[], endDate: string) {
  const dates = last7Dates(endDate);
  return dates.map((date) => getCurrentLog(logs, date));
}

function buildWeeklyComments(weekLogs: DailyLog[], patient: Patient) {
  const avgKcal = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalKcal), 0) / 7);
  const avgProtein = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalProtein), 0) / 7);
  const avgSodium = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalSodium), 0) / 7);
  const avgPotassium = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalPotassium), 0) / 7);

  const comments: string[] = [];
  const kcalTarget = toNumber(patient.targetKcal);
  const proteinTarget = toNumber(patient.targetProtein);
  const sodiumTarget = sodiumTargetToMg(patient.targetSodium);
  const potassiumTarget = toNumber(patient.targetPotassium);

  comments.push("1週間しっかり記録できています。続けること自体がとても大切です。");

  if (kcalTarget && avgKcal < kcalTarget * 0.85) {
    comments.push("1週間を通してエネルギーが少なめです。食べられる食品で無理なく底上げしていきましょう。");
  } else {
    comments.push("エネルギー量は大きく崩れていません。この調子で確認を続けましょう。");
  }

  if (proteinTarget && avgProtein < proteinTarget * 0.85) {
    comments.push("たんぱく質が少なめの日がありました。制限しすぎず、目標に近づける意識が役立ちます。");
  } else {
    comments.push("たんぱく質は概ね維持できています。よく観察できています。");
  }

  if (sodiumTarget && avgSodium > sodiumTarget) {
    comments.push("塩分は少し高めでした。調味料の量を見直すだけでも前向きな変化につながります。");
  } else if (sodiumTarget) {
    comments.push("塩分は概ね目標内です。落ち着いて取り組めています。");
  }

  if (potassiumTarget && avgPotassium > potassiumTarget) {
    comments.push("カリウムは高めの日がありました。食品選びを少し整えるだけでも十分前進です。");
  }

  comments.push("完璧を目指すより、昨日より少し分かることが増えた、という積み重ねで大丈夫です。");
  return comments;
}

function openWeeklyPrint(patient: Patient, logs: DailyLog[], vitals: VitalEntry[], selectedDate: string) {
  const weekLogs = get7DayLogs(logs, selectedDate);
  const weekDates = last7Dates(selectedDate);
  const weekVitals = getLatestVitalPerDate(vitals, weekDates);
  const comments = buildWeeklyComments(weekLogs, patient);

  const avgKcal = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalKcal), 0) / 7);
  const avgProtein = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalProtein), 0) / 7);
  const avgSodium = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalSodium), 0) / 7);
  const avgPotassium = format1(weekLogs.reduce((sum, l) => sum + toNumber(l.totalPotassium), 0) / 7);

  const memoHtml = weekLogs
    .filter((log) => log.memo && log.memo.trim())
    .map((log) => `<li><strong>${log.date}</strong>：${log.memo}</li>`)
    .join("");

  const rowsHtml = weekLogs
    .map(
      (log) => `<tr>
        <td>${log.date}</td>
        <td>${log.totalKcal}</td>
        <td>${log.totalProtein}</td>
        <td>${log.totalSodium}</td>
        <td>${log.totalPotassium}</td>
      </tr>`
    )
    .join("");

  const vitalHtml = weekVitals
    .map(
      (v) => `<tr>
        <td>${v.date}</td>
        <td>${v.weight || "-"}</td>
        <td>${v.systolic || "-"}</td>
        <td>${v.diastolic || "-"}</td>
      </tr>`
    )
    .join("");

  const commentHtml = comments.map((c) => `<li>${c}</li>`).join("");

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>1週間のまとめ</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: sans-serif; color: #0f172a; }
          .page { width: 190mm; margin: 0 auto; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          h2 { font-size: 16px; margin: 12px 0 6px; }
          p, li, td, th { font-size: 12px; line-height: 1.45; }
          .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
          ul { padding-left: 18px; margin: 6px 0; }
          .small { font-size: 11px; color: #475569; }
          .tight { margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>1週間のまとめ</h1>
          <div class="box">
            <p><strong>患者名：</strong>${patient.name || "未設定"}　
            <strong>年齢：</strong>${patient.age || "-"}歳　
            <strong>eGFR：</strong>${patient.egfr || "-"}</p>
            <p class="small">対象期間：${weekDates[0]} 〜 ${weekDates[6]}</p>
          </div>

          <div class="box">
            <h2>1週間の平均</h2>
            <div class="grid">
              <div><strong>カロリー</strong><br>${avgKcal} kcal</div>
              <div><strong>たんぱく質</strong><br>${avgProtein} g</div>
              <div><strong>ナトリウム</strong><br>${avgSodium} mg</div>
              <div><strong>カリウム</strong><br>${avgPotassium} mg</div>
            </div>
          </div>

          <div class="box">
            <h2>1週間の評価</h2>
            <ul>${commentHtml}</ul>
          </div>

          <div class="box">
            <h2>食事の記録</h2>
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>kcal</th>
                  <th>たんぱく質</th>
                  <th>Na</th>
                  <th>K</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>

          <div class="box">
            <h2>体重・血圧の記録</h2>
            <table>
              <thead>
                <tr>
                  <th>日付</th>
                  <th>体重</th>
                  <th>収縮期</th>
                  <th>拡張期</th>
                </tr>
              </thead>
              <tbody>${vitalHtml}</tbody>
            </table>
          </div>

          <div class="box">
            <h2>メモ</h2>
            ${memoHtml ? `<ul class="tight">${memoHtml}</ul>` : `<p>この1週間のメモはありません。</p>`}
          </div>

          <p class="small">印刷画面で「PDFに保存」を選ぶと、A4の1枚として保存できます。</p>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 300);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function SmallInfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="small-card">
      <div className="small-card-label">{label}</div>
      <div className="small-card-value">{value}</div>
    </div>
  );
}

function NavButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`nav-btn ${active ? "active" : ""}`}>
      {label}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  color = "#2563eb",
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button type="button" onClick={onClick} className="action-btn" style={{ background: color }}>
      {label}
    </button>
  );
}

function MetricBar({
  label,
  total,
  target,
  unit,
  mode,
}: {
  label: string;
  total: number;
  target: string;
  unit: string;
  mode: "normal" | "upper";
}) {
  const status = metricStatus(total, target, mode);
  const width = Math.max(0, Math.min(100, status.ratio * 100));
  const color =
    status.tone === "good"
      ? "#10b981"
      : status.tone === "warn"
      ? "#f59e0b"
      : status.tone === "danger"
      ? "#ef4444"
      : "#0ea5e9";

  const bg =
    status.tone === "good"
      ? "#ecfdf5"
      : status.tone === "warn"
      ? "#fffbeb"
      : status.tone === "danger"
      ? "#fef2f2"
      : "#f0f9ff";

  const text =
    status.tone === "good"
      ? "#047857"
      : status.tone === "warn"
      ? "#b45309"
      : status.tone === "danger"
      ? "#b91c1c"
      : "#0369a1";

  return (
    <div className="metric-wrap">
      <div className="metric-head">
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-sub">{format1(total)} / {target || "-"} {unit}</div>
        </div>
        <div className="metric-badge" style={{ background: bg, color: text, borderColor: `${color}33` }}>
          {status.label}
        </div>
      </div>
      <div className="metric-track">
        <div className="metric-fill" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function SimpleLineChart({
  title,
  values,
  color = "#2563eb",
  unit = "",
}: {
  title: string;
  values: { label: string; value: number }[];
  color?: string;
  unit?: string;
}) {
  const plotted = values.filter((v) => Number.isFinite(v.value) && v.value > 0);

  if (plotted.length === 0) {
    return (
      <div className="chart-box">
        <div className="chart-title">{title}</div>
        <div className="muted-text">まだ記録がありません。</div>
      </div>
    );
  }

  const width = 420;
  const height = 180;
  const padding = 24;
  const min = Math.min(...plotted.map((v) => v.value));
  const max = Math.max(...plotted.map((v) => v.value));
  const range = max - min || 1;

  const points = plotted
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(plotted.length - 1, 1);
      const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-box">
      <div className="chart-title">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {plotted.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(plotted.length - 1, 1);
          const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#334155">
                {item.value}{unit}
              </text>
              <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="muted-text">直近7日間の表示です。</div>
    </div>
  );
}



function downloadCsv(patient: Patient, logs: DailyLog[], vitals: VitalEntry[], selectedDate: string) {
  const currentLog = getCurrentLog(logs, selectedDate);
  const todayVitals = [...vitals]
    .filter((v) => v.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const escapeCsv = (value: string | number | null | undefined) => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows: (string | number)[][] = [];

  rows.push(["患者情報"]);
  rows.push(["項目", "値"]);
  rows.push(["患者名", patient.name || ""]);
  rows.push(["年齢", patient.age || ""]);
  rows.push(["eGFR", patient.egfr || ""]);
  rows.push(["透析", patient.dialysis || ""]);
  rows.push(["高カリウム血症", patient.highPotassium || ""]);
  rows.push(["目標カロリー", patient.targetKcal || ""]);
  rows.push(["目標たんぱく質", patient.targetProtein || ""]);
  rows.push(["目標ナトリウム", patient.targetSodium || ""]);
  rows.push(["目標カリウム", patient.targetPotassium || ""]);
  rows.push([]);

  rows.push(["日別記録"]);
  rows.push(["日付", "メモ", "総カロリー", "総たんぱく質", "総ナトリウム", "総カリウム"]);
  rows.push([
    selectedDate,
    currentLog.memo || "",
    currentLog.totalKcal || 0,
    currentLog.totalProtein || 0,
    currentLog.totalSodium || 0,
    currentLog.totalPotassium || 0,
  ]);
  rows.push([]);

  rows.push(["体重・血圧記録"]);
  rows.push(["日付", "時刻", "体重", "収縮期", "拡張期"]);
  if (todayVitals.length === 0) {
    rows.push([selectedDate, "", "", "", ""]);
  } else {
    todayVitals.forEach((v) => {
      rows.push([v.date, v.time, v.weight || "", v.systolic || "", v.diastolic || ""]);
    });
  }
  rows.push([]);

  rows.push(["食事記録"]);
  rows.push(["食事区分", "科目", "食品名", "量", "kcal", "たんぱく質", "ナトリウム", "カリウム"]);
  if (currentLog.items.length === 0) {
    rows.push(["", "", "", "", "", "", "", ""]);
  } else {
    currentLog.items.forEach((item) => {
      rows.push([
        item.mealType,
        item.subject,
        item.foodName,
        item.amountLabel,
        item.kcal,
        item.protein,
        item.sodium,
        item.potassium,
      ]);
    });
  }

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `ckd-record-${selectedDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Page() {
  const supabase = createClient();
  const [page, setPage] = useState<"dashboard" | "patient" | "meal">("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayString());

  const [patient, setPatient] = useState<Patient>(emptyPatient);
  const [authEmail, setAuthEmail] = useState("");
  const [patientCloudMessage, setPatientCloudMessage] = useState("");
  const [dailyLogCloudMessage, setDailyLogCloudMessage] = useState("");
  const [vitalCloudMessage, setVitalCloudMessage] = useState("");
  const [mealCloudMessage, setMealCloudMessage] = useState("");
  const [subjectFoodCloudMessage, setSubjectFoodCloudMessage] = useState("");
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [vitals, setVitals] = useState<VitalEntry[]>([]);
  const [customFoods, setCustomFoods] = useState<FoodMasterItem[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);

  const [memoInput, setMemoInput] = useState("");

  const [mealType, setMealType] = useState("朝食");
  const [selectedFoodId, setSelectedFoodId] = useState(baseFoods[0].id);
  const [servings, setServings] = useState("1");
  const [subjectFilter, setSubjectFilter] = useState("すべて");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [packageSubject, setPackageSubject] = useState("既製品");
  const [packageName, setPackageName] = useState("");
  const [packageAmount, setPackageAmount] = useState("1食分");
  const [packageServings, setPackageServings] = useState("1");
  const [packageKcal, setPackageKcal] = useState("");
  const [packageProtein, setPackageProtein] = useState("");
  const [packageSaltEq, setPackageSaltEq] = useState("");
  const [packagePotassium, setPackagePotassium] = useState("");

  const [customFoodSubject, setCustomFoodSubject] = useState("すべて");
  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodAmount, setCustomFoodAmount] = useState("1食分");
  const [customFoodKcal, setCustomFoodKcal] = useState("");
  const [customFoodProtein, setCustomFoodProtein] = useState("");
  const [customFoodSodium, setCustomFoodSodium] = useState("");
  const [customFoodPotassium, setCustomFoodPotassium] = useState("");

  const [vitalDate, setVitalDate] = useState(todayString());
  const [vitalTime, setVitalTime] = useState(timeString());
  const [weightInput, setWeightInput] = useState("");
  const [systolicInput, setSystolicInput] = useState("");
  const [diastolicInput, setDiastolicInput] = useState("");


  useEffect(() => {
    getSignedInUser().then((user) => {
      setAuthEmail(user?.email || "");
    });
  }, []);

  useEffect(() => {
    try {
      const savedPatient = localStorage.getItem(PATIENT_KEY);
      const savedLogs = localStorage.getItem(LOGS_KEY);
      const savedVitals = localStorage.getItem(VITALS_KEY);
      const savedCustomFoods = localStorage.getItem(CUSTOM_FOODS_KEY);
      const savedSubjects = localStorage.getItem(SUBJECTS_KEY);

      if (savedPatient) setPatient(JSON.parse(savedPatient));
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedVitals) setVitals(JSON.parse(savedVitals));
      if (savedCustomFoods) setCustomFoods(JSON.parse(savedCustomFoods));
      if (savedSubjects) setCustomSubjects(JSON.parse(savedSubjects));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
  }, [patient]);

  useEffect(() => {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(VITALS_KEY, JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(customFoods));
  }, [customFoods]);

  useEffect(() => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(customSubjects));
  }, [customSubjects]);

  const allFoods = useMemo(() => [...baseFoods, ...customFoods], [customFoods]);

  const subjects = useMemo(() => {
    const list = [
      ...baseFoods.map((food) => food.subject),
      ...customFoods.map((food) => food.subject),
      ...customSubjects,
      "既製品",
    ];
    return ["すべて", ...Array.from(new Set(list.filter(Boolean)))];
  }, [customFoods, customSubjects]);

  useEffect(() => {
    if (packageSubject === "すべて") setPackageSubject("既製品");
    if (customFoodSubject === "すべて") setCustomFoodSubject("主食");
  }, [packageSubject, customFoodSubject]);

  const currentLog = useMemo(() => getCurrentLog(logs, selectedDate), [logs, selectedDate]);

  useEffect(() => {
    setMemoInput(currentLog.memo || "");
  }, [currentLog]);

  const totals = useMemo(() => {
    if (!currentLog.items.length) {
      return {
        kcal: format1(currentLog.totalKcal),
        protein: format1(currentLog.totalProtein),
        sodium: format1(currentLog.totalSodium),
        potassium: format1(currentLog.totalPotassium),
      };
    }
    return calculateTotals(currentLog.items);
  }, [
    currentLog.items,
    currentLog.totalKcal,
    currentLog.totalProtein,
    currentLog.totalSodium,
    currentLog.totalPotassium,
  ]);

  const filteredFoods = useMemo(() => {
    if (subjectFilter === "すべて") return allFoods;
    return allFoods.filter((food) => food.subject === subjectFilter);
  }, [allFoods, subjectFilter]);

  useEffect(() => {
    const exists = filteredFoods.some((food) => food.id === selectedFoodId);
    if (!exists && filteredFoods[0]) {
      setSelectedFoodId(filteredFoods[0].id);
    }
  }, [filteredFoods, selectedFoodId]);

  const selectedFood = useMemo(
    () => allFoods.find((food) => food.id === selectedFoodId) || allFoods[0] || baseFoods[0],
    [allFoods, selectedFoodId]
  );

  const mealPreview = useMemo(() => {
    const s = Math.max(0.1, toNumber(servings) || 1);
    return {
      amountLabel: `${s} × ${selectedFood.baseAmount}`,
      kcal: format1(selectedFood.kcal * s),
      protein: format1(selectedFood.protein * s),
      sodium: format1(selectedFood.sodium * s),
      potassium: format1(selectedFood.potassium * s),
      servings: s,
    };
  }, [selectedFood, servings]);

  const packagePreview = useMemo(() => {
    const s = Math.max(0.1, toNumber(packageServings) || 1);
    const saltEq = toNumber(packageSaltEq) * s;
    const sodium = format1((saltEq * 1000) / 2.54);
    return {
      servings: s,
      kcal: format1(toNumber(packageKcal) * s),
      protein: format1(toNumber(packageProtein) * s),
      sodium,
      potassium: format1(toNumber(packagePotassium) * s),
      amountLabel: `${s} × ${packageAmount || "1食分"}`,
      saltEq: format1(saltEq),
    };
  }, [packageServings, packageKcal, packageProtein, packageSaltEq, packagePotassium, packageAmount]);

  const weekVitalSeries = useMemo(() => getRecentVitalSeries(vitals, selectedDate), [vitals, selectedDate]);
  
  const todayVitals = useMemo(() => {
    return [...vitals]
      .filter((v) => v.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [vitals, selectedDate]);

  const summaryMessages = useMemo(() => buildSummaryMessages(totals, patient), [totals, patient]);
  const sodiumTargetMg = useMemo(() => sodiumTargetToMg(patient.targetSodium), [patient.targetSodium]);
  function savePatientField(key: keyof Patient, value: string) {
    setPatient((prev) => ({ ...prev, [key]: value }));
  }

  async function getSignedInUser() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) return null;
    return session.user;
  }

  async function loadPatientFromSupabase() {
    setPatientCloudMessage("読み込み中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setPatientCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      setPatientCloudMessage("Supabase読み込みエラー: " + error.message);
      return;
    }

    if (!data) {
      setPatientCloudMessage("Supabaseにはまだ患者データがありません。");
      return;
    }

    setPatient((prev) => ({
      ...prev,
      name: data.name ? String(data.name) : "",
      age: data.age != null ? String(data.age) : "",
      egfr: data.egfr != null ? String(data.egfr) : "",
      dialysis: data.dialysis ? String(data.dialysis) : prev.dialysis,
      highPotassium: data.high_potassium ? String(data.high_potassium) : prev.highPotassium,
      targetKcal: data.target_kcal != null ? String(data.target_kcal) : "",
      targetProtein: data.target_protein != null ? String(data.target_protein) : "",
      targetSodium: data.target_sodium != null ? String(data.target_sodium) : "",
      targetPotassium: data.target_potassium != null ? String(data.target_potassium) : "",
    }));

    setPatientCloudMessage("Supabaseから患者設定を読み込みました。");
  }

  async function savePatientToSupabase() {
    setPatientCloudMessage("保存中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setPatientCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const payload = {
      user_id: user.id,
      name: patient.name || null,
      age: patient.age ? Number(patient.age) : null,
      egfr: patient.egfr ? Number(patient.egfr) : null,
      dialysis: patient.dialysis || null,
      high_potassium: patient.highPotassium || null,
      target_kcal: patient.targetKcal ? Number(patient.targetKcal) : null,
      target_protein: patient.targetProtein ? Number(patient.targetProtein) : null,
      target_sodium: patient.targetSodium ? Number(patient.targetSodium) : null,
      target_potassium: patient.targetPotassium ? Number(patient.targetPotassium) : null,
    };

    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        setPatientCloudMessage("Supabase保存エラー: " + error.message);
        return;
      }

      setPatientCloudMessage("Supabaseの患者設定を更新しました。");
      return;
    }

    const { error } = await supabase.from("patients").insert(payload);

    if (error) {
      setPatientCloudMessage("Supabase保存エラー: " + error.message);
      return;
    }

    setPatientCloudMessage("Supabaseに患者設定を保存しました。");
  }

  async function loadDailyLogFromSupabase() {
    setDailyLogCloudMessage("読み込み中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setDailyLogCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .maybeSingle();

    if (error) {
      setDailyLogCloudMessage("Supabase読み込みエラー: " + error.message);
      return;
    }

    if (!data) {
      setDailyLogCloudMessage("Supabaseにはこの日の記録がまだありません。");
      return;
    }

    const nextLog: DailyLog = {
      date: selectedDate,
      items: currentLog.items,
      memo: data.memo ? String(data.memo) : "",
      totalKcal: data.total_kcal != null ? Number(data.total_kcal) : 0,
      totalProtein: data.total_protein != null ? Number(data.total_protein) : 0,
      totalSodium: data.total_sodium != null ? Number(data.total_sodium) : 0,
      totalPotassium: data.total_potassium != null ? Number(data.total_potassium) : 0,
    };

    setMemoInput(nextLog.memo);
    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    setDailyLogCloudMessage("Supabaseからこの日の記録を読み込みました。");
  }

  async function saveDailyLogToSupabase() {
    setDailyLogCloudMessage("保存中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setDailyLogCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const payload = {
      user_id: user.id,
      log_date: selectedDate,
      memo: memoInput || null,
      total_kcal: totals.kcal,
      total_protein: totals.protein,
      total_sodium: totals.sodium,
      total_potassium: totals.potassium,
    };

    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });

    if (error) {
      setDailyLogCloudMessage("Supabase保存エラー: " + error.message);
      return;
    }

    const nextLog: DailyLog = {
      date: selectedDate,
      items: currentLog.items,
      memo: memoInput,
      totalKcal: totals.kcal,
      totalProtein: totals.protein,
      totalSodium: totals.sodium,
      totalPotassium: totals.potassium,
    };

    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    setDailyLogCloudMessage("Supabaseの日別記録を更新しました。");
  }

  async function loadVitalsFromSupabase() {
    setVitalCloudMessage("読み込み中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setVitalCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { data, error } = await supabase
      .from("vital_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", selectedDate)
      .order("entry_time", { ascending: true });

    if (error) {
      setVitalCloudMessage("Supabase読み込みエラー: " + error.message);
      return;
    }

    const loadedVitals: VitalEntry[] = (data || []).map((row) => ({
      id: String(row.id),
      date: String(row.entry_date),
      time: String(row.entry_time).slice(0, 5),
      weight: row.weight != null ? String(row.weight) : "",
      systolic: row.systolic != null ? String(row.systolic) : "",
      diastolic: row.diastolic != null ? String(row.diastolic) : "",
    }));

    setVitals((prev) => [
      ...prev.filter((v) => v.date !== selectedDate),
      ...loadedVitals,
    ]);

    setVitalCloudMessage(
      loadedVitals.length
        ? "Supabaseからこの日の体重・血圧記録を読み込みました。"
        : "Supabaseにはこの日の体重・血圧記録がまだありません。"
    );
  }

  async function saveVitalsToSupabase() {
    setVitalCloudMessage("保存中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setVitalCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { error: deleteError } = await supabase
      .from("vital_entries")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_date", selectedDate);

    if (deleteError) {
      setVitalCloudMessage("Supabase保存エラー: " + deleteError.message);
      return;
    }

   if (!todayVitals.length) {
  await loadVitalsFromSupabase();
  setVitalCloudMessage("この日の体重・血圧記録は0件として保存しました。最新データを再読込しました。");
  return;
}
 
    const payload = todayVitals.map((v) => ({
      user_id: user.id,
      entry_date: selectedDate,
      entry_time: v.time && v.time.length === 5 ? `${v.time}:00` : v.time,
      weight: v.weight ? Number(v.weight) : null,
      systolic: v.systolic ? Number(v.systolic) : null,
      diastolic: v.diastolic ? Number(v.diastolic) : null,
    }));

    const { error: insertError } = await supabase
      .from("vital_entries")
      .insert(payload);

    if (insertError) {
  setVitalCloudMessage("Supabase保存エラー: " + insertError.message);
  return;
}

await loadVitalsFromSupabase();
setVitalCloudMessage("Supabaseの体重・血圧記録を更新しました。最新データを再読込しました。");
}    
    
    

  async function loadMealItemsFromSupabase() {
    setMealCloudMessage("読み込み中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setMealCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { data: logRow, error: logError } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .maybeSingle();

    if (logError) {
      setMealCloudMessage("Supabase読み込みエラー: " + logError.message);
      return;
    }

    if (!logRow) {
      const emptyLog: DailyLog = {
        date: selectedDate,
        items: [],
        memo: "",
        totalKcal: 0,
        totalProtein: 0,
        totalSodium: 0,
        totalPotassium: 0,
      };

      setMemoInput("");
      setLogs((prev) => {
        const exists = prev.some((log) => log.date === selectedDate);
        if (exists) return prev.map((log) => (log.date === selectedDate ? emptyLog : log));
        return [...prev, emptyLog];
      });

      setMealCloudMessage("Supabaseにはこの日の食事記録がまだありません。");
      return;
    }

    const { data: mealRows, error: mealError } = await supabase
      .from("meal_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("daily_log_id", logRow.id)
      .order("created_at", { ascending: true });

    if (mealError) {
      setMealCloudMessage("Supabase読み込みエラー: " + mealError.message);
      return;
    }

    const loadedItems: MealItem[] = (mealRows || []).map((row) => ({
      id: String(row.id),
      mealType: row.meal_type ? String(row.meal_type) : "",
      foodId: "supabase-loaded",
      foodName: row.food_name ? String(row.food_name) : "",
      subject: row.subject_name ? String(row.subject_name) : "",
      amountLabel: row.amount_label ? String(row.amount_label) : "",
      servings: row.servings != null ? Number(row.servings) : 1,
      kcal: row.kcal != null ? Number(row.kcal) : 0,
      protein: row.protein != null ? Number(row.protein) : 0,
      sodium: row.sodium != null ? Number(row.sodium) : 0,
      potassium: row.potassium != null ? Number(row.potassium) : 0,
      sourceType: row.source_type === "package" ? "package" : "master",
    }));

    const nextLog: DailyLog = {
      date: selectedDate,
      items: loadedItems,
      memo: logRow.memo ? String(logRow.memo) : "",
      totalKcal: logRow.total_kcal != null ? Number(logRow.total_kcal) : 0,
      totalProtein: logRow.total_protein != null ? Number(logRow.total_protein) : 0,
      totalSodium: logRow.total_sodium != null ? Number(logRow.total_sodium) : 0,
      totalPotassium: logRow.total_potassium != null ? Number(logRow.total_potassium) : 0,
    };

    setMemoInput(nextLog.memo);
    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    setMealCloudMessage(
      loadedItems.length
        ? "Supabaseからこの日の食事記録を読み込みました。"
        : "Supabaseにはこの日の食品一覧がまだありません。"
    );
  }

  async function saveMealItemsToSupabase() {
    setMealCloudMessage("保存中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setMealCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const dailyPayload = {
      user_id: user.id,
      log_date: selectedDate,
      memo: memoInput || null,
      total_kcal: totals.kcal,
      total_protein: totals.protein,
      total_sodium: totals.sodium,
      total_potassium: totals.potassium,
    };

    const { data: logRow, error: upsertError } = await supabase
      .from("daily_logs")
      .upsert(dailyPayload, { onConflict: "user_id,log_date" })
      .select()
      .single();

    if (upsertError || !logRow) {
      setMealCloudMessage("Supabase保存エラー: " + (upsertError?.message || "daily_logs の保存に失敗しました。"));
      return;
    }

    const { error: deleteError } = await supabase
      .from("meal_items")
      .delete()
      .eq("user_id", user.id)
      .eq("daily_log_id", logRow.id);

    if (deleteError) {
      setMealCloudMessage("Supabase保存エラー: " + deleteError.message);
      return;
    }

    if (!currentLog.items.length) {
  await loadMealItemsFromSupabase();
  setMealCloudMessage("この日の食品一覧は0件として保存しました。最新データを再読込しました。");
  return;
}
 
    const payload = currentLog.items.map((item) => ({
      daily_log_id: logRow.id,
      user_id: user.id,
      meal_type: item.mealType,
      source_type: item.sourceType,
      subject_name: item.subject || null,
      food_name: item.foodName,
      amount_label: item.amountLabel || null,
      servings: item.servings != null ? Number(item.servings) : 1,
      kcal: Number(item.kcal) || 0,
      protein: Number(item.protein) || 0,
      sodium: Number(item.sodium) || 0,
      potassium: Number(item.potassium) || 0,
    }));

    const { error: insertError } = await supabase
      .from("meal_items")
      .insert(payload);

    if (insertError) {
      setMealCloudMessage("Supabase保存エラー: " + insertError.message);
      return;
    }

    if (insertError) {
  setMealCloudMessage("Supabase保存エラー: 食事記録の保存に失敗しました。");
  return;
}
 
    await loadMealItemsFromSupabase();
    setMealCloudMessage("Supabaseの食事記録を更新しました。最新データを再読込しました。");

    setMealCloudMessage("Supabaseの食事記録を更新しました。");
  }

  async function loadSubjectsAndFoodsFromSupabase() {
    setSubjectFoodCloudMessage("読み込み中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setSubjectFoodCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { data: subjectRows, error: subjectError } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (subjectError) {
      setSubjectFoodCloudMessage("科目の読み込みエラー: " + subjectError.message);
      return;
    }

    const loadedSubjects = (subjectRows || []).map((row) => String(row.name));

    const { data: foodRows, error: foodError } = await supabase
      .from("custom_foods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (foodError) {
      setSubjectFoodCloudMessage("食品候補の読み込みエラー: " + foodError.message);
      return;
    }

    const loadedFoods: FoodMasterItem[] = (foodRows || []).map((row) => ({
      id: String(row.id),
      subject: row.subject_name ? String(row.subject_name) : "その他",
      name: row.name ? String(row.name) : "",
      baseAmount: row.base_amount ? String(row.base_amount) : "1食分",
      kcal: row.kcal != null ? Number(row.kcal) : 0,
      protein: row.protein != null ? Number(row.protein) : 0,
      sodium: row.sodium != null ? Number(row.sodium) : 0,
      potassium: row.potassium != null ? Number(row.potassium) : 0,
      note: row.note ? String(row.note) : "",
      isCustom: true,
    }));

    setCustomSubjects(loadedSubjects);
    setCustomFoods(loadedFoods);

    if (loadedSubjects.length > 0) {
      setPackageSubject(loadedSubjects[0]);
      setCustomFoodSubject(loadedSubjects[0]);
    }

    setSubjectFoodCloudMessage("Supabaseから科目と食品候補を読み込みました。");
  }

  async function saveSubjectsAndFoodsToSupabase() {
    setSubjectFoodCloudMessage("保存中...");
    const user = await getSignedInUser();

    if (!user) {
      setAuthEmail("");
      setSubjectFoodCloudMessage("未ログインです。/login からログインしてください。");
      return;
    }

    setAuthEmail(user.email || "");

    const { error: deleteSubjectsError } = await supabase
      .from("subjects")
      .delete()
      .eq("user_id", user.id);

    if (deleteSubjectsError) {
      setSubjectFoodCloudMessage("科目の保存エラー: " + deleteSubjectsError.message);
      return;
    }

    if (customSubjects.length > 0) {
      const subjectPayload = customSubjects.map((name) => ({
        user_id: user.id,
        name,
      }));

      const { error: insertSubjectsError } = await supabase
        .from("subjects")
        .insert(subjectPayload);

      if (insertSubjectsError) {
        setSubjectFoodCloudMessage("科目の保存エラー: " + insertSubjectsError.message);
        return;
      }
    }

    const { error: deleteFoodsError } = await supabase
      .from("custom_foods")
      .delete()
      .eq("user_id", user.id);

    if (deleteFoodsError) {
      setSubjectFoodCloudMessage("食品候補の保存エラー: " + deleteFoodsError.message);
      return;
    }

    if (customFoods.length > 0) {
      const foodPayload = customFoods.map((food) => ({
        user_id: user.id,
        subject_name: food.subject || "その他",
        name: food.name,
        base_amount: food.baseAmount || "1食分",
        kcal: Number(food.kcal) || 0,
        protein: Number(food.protein) || 0,
        sodium: Number(food.sodium) || 0,
        potassium: Number(food.potassium) || 0,
        note: food.note || null,
      }));

      const { error: insertFoodsError } = await supabase
        .from("custom_foods")
        .insert(foodPayload);

      if (insertFoodsError) {
        setSubjectFoodCloudMessage("食品候補の保存エラー: " + insertFoodsError.message);
        return;
      }
    }

    setSubjectFoodCloudMessage("Supabaseの科目と食品候補を更新しました。");
  }






  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;

      setPatient((prev) => ({
        ...prev,
        photo: result,
      }));
    };

    reader.readAsDataURL(file);
  }

  function addSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    if (subjects.includes(name)) {
      alert("同じ科目名があります");
      return;
    }
    setCustomSubjects((prev) => [...prev, name]);
    setNewSubjectName("");
    setPackageSubject(name);
    setCustomFoodSubject(name);
  }

  function addMealItem() {
        if (!selectedFood) {
      setMealCloudMessage("食品候補を選択してください。");
      return;
    }
    if (!mealType.trim()) {
      setMealCloudMessage("食事区分を選択してください。");
      return;
    }
    if (!Number.isFinite(mealPreview.servings) || mealPreview.servings <= 0 || mealPreview.servings > 10) {
      setMealCloudMessage("量の倍率は0より大きく10以下で入力してください。");
      return;
    }
    if ([mealPreview.kcal, mealPreview.protein, mealPreview.sodium, mealPreview.potassium].some((v) => !Number.isFinite(v) || v < 0)) {
      setMealCloudMessage("栄養値が不正です。入力内容を確認してください。");
      return;
    }

    setMealCloudMessage("");
    const item: MealItem = {
      id: crypto.randomUUID(),
      mealType,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      subject: selectedFood.subject,
      amountLabel: mealPreview.amountLabel,
      servings: mealPreview.servings,
      kcal: mealPreview.kcal,
      protein: mealPreview.protein,
      sodium: mealPreview.sodium,
      potassium: mealPreview.potassium,
      sourceType: "master",
    };

    const nextItems = [...currentLog.items, item];
    const nextTotals = calculateTotals(nextItems);

    const nextLog: DailyLog = {
      date: selectedDate,
      items: nextItems,
      memo: memoInput,
      totalKcal: nextTotals.kcal,
      totalProtein: nextTotals.protein,
      totalSodium: nextTotals.sodium,
      totalPotassium: nextTotals.potassium,
    };

    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    alert("食品を追加しました");
  }

  function addPackageItem() {
    
        if (!packageName.trim()) {
      setMealCloudMessage("商品名を入力してください。");
      return;
    }
    if (!mealType.trim()) {
      setMealCloudMessage("食事区分を選択してください。");
      return;
    }

    const servings = Number(packageServings);
    const kcal = Number(packageKcal);
    const protein = Number(packageProtein);
    const saltEq = Number(packageSaltEq);
    const potassium = Number(packagePotassium);

    if (!Number.isFinite(servings) || servings <= 0 || servings > 10) {
      setMealCloudMessage("量の倍率は0より大きく10以下で入力してください。");
      return;
    }
    if (!Number.isFinite(kcal) || kcal < 0 || kcal > 5000) {
      setMealCloudMessage("カロリーは0〜5000の範囲で入力してください。");
      return;
    }
    if (!Number.isFinite(protein) || protein < 0 || protein > 300) {
      setMealCloudMessage("たんぱく質は0〜300gの範囲で入力してください。");
      return;
    }
    if (!Number.isFinite(saltEq) || saltEq < 0 || saltEq > 30) {
      setMealCloudMessage("食塩相当量は0〜30gの範囲で入力してください。");
      return;
    }
    if (!Number.isFinite(potassium) || potassium < 0 || potassium > 5000) {
      setMealCloudMessage("カリウムは0〜5000mgの範囲で入力してください。");
      return;
    }

    setMealCloudMessage("");

    
    

    const item: MealItem = {
      id: crypto.randomUUID(),
      mealType,
      foodId: "package-manual",
      foodName: packageName.trim(),
      subject: packageSubject === "すべて" ? "既製品" : packageSubject,
      amountLabel: packagePreview.amountLabel,
      servings: packagePreview.servings,
      kcal: packagePreview.kcal,
      protein: packagePreview.protein,
      sodium: packagePreview.sodium,
      potassium: packagePreview.potassium,
      sourceType: "package",
    };

    const nextItems = [...currentLog.items, item];
    const nextTotals = calculateTotals(nextItems);

    const nextLog: DailyLog = {
      date: selectedDate,
      items: nextItems,
      memo: memoInput,
      totalKcal: nextTotals.kcal,
      totalProtein: nextTotals.protein,
      totalSodium: nextTotals.sodium,
      totalPotassium: nextTotals.potassium,
    };

    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    alert("既製品を記録に追加しました");
  }

  function savePackageAsCandidate() {
    if (!packageName.trim()) {
      alert("商品名を入れてください");
      return;
    }
    const subject = packageSubject === "すべて" ? "既製品" : packageSubject;

    const newFood: FoodMasterItem = {
      id: `custom-package-${Date.now()}`,
      subject,
      name: packageName.trim(),
      baseAmount: packageAmount || "1食分",
      kcal: packagePreview.kcal,
      protein: packagePreview.protein,
      sodium: packagePreview.sodium,
      potassium: packagePreview.potassium,
      note: "既製品の成分表から追加",
      isCustom: true,
    };

    setCustomFoods((prev) => [...prev, newFood]);
    if (!subjects.includes(subject)) {
      setCustomSubjects((prev) => [...prev, subject]);
    }
    alert("既製品を候補に保存しました");
  }

  function saveCustomFood() {
    if (!customFoodName.trim()) {
      alert("食品名を入れてください");
      return;
    }
    const subject = customFoodSubject === "すべて" ? "その他" : customFoodSubject;

    const newFood: FoodMasterItem = {
      id: `custom-food-${Date.now()}`,
      subject,
      name: customFoodName.trim(),
      baseAmount: customFoodAmount || "1食分",
      kcal: toNumber(customFoodKcal),
      protein: toNumber(customFoodProtein),
      sodium: toNumber(customFoodSodium),
      potassium: toNumber(customFoodPotassium),
      note: "アプリ上で追加した候補",
      isCustom: true,
    };

    setCustomFoods((prev) => [...prev, newFood]);
    if (!subjects.includes(subject)) {
      setCustomSubjects((prev) => [...prev, subject]);
    }

    setCustomFoodName("");
    setCustomFoodAmount("1食分");
    setCustomFoodKcal("");
    setCustomFoodProtein("");
    setCustomFoodSodium("");
    setCustomFoodPotassium("");

    alert("食品候補に保存しました");
  }

  function deleteMealItem(id: string) {
    const nextItems = currentLog.items.filter((item) => item.id !== id);
    const nextTotals = calculateTotals(nextItems);

    const nextLog: DailyLog = {
      date: selectedDate,
      items: nextItems,
      memo: memoInput,
      totalKcal: nextTotals.kcal,
      totalProtein: nextTotals.protein,
      totalSodium: nextTotals.sodium,
      totalPotassium: nextTotals.potassium,
    };

    setLogs((prev) => prev.map((log) => (log.date === selectedDate ? nextLog : log)));
  }

  function saveMemo() {
    const nextLog: DailyLog = {
      date: selectedDate,
      items: currentLog.items,
      memo: memoInput,
      totalKcal: totals.kcal,
      totalProtein: totals.protein,
      totalSodium: totals.sodium,
      totalPotassium: totals.potassium,
    };

    setLogs((prev) => {
      const exists = prev.some((log) => log.date === selectedDate);
      if (exists) return prev.map((log) => (log.date === selectedDate ? nextLog : log));
      return [...prev, nextLog];
    });

    alert("メモを保存しました");
  }

  function addVital() {
        const weightText = weightInput.trim();
    const systolicText = systolicInput.trim();
    const diastolicText = diastolicInput.trim();

    if (!weightText) {
      setVitalCloudMessage("体重を入力してください。");
      return;
    }
    if (!systolicText) {
      setVitalCloudMessage("収縮期血圧を入力してください。");
      return;
    }
    if (!diastolicText) {
      setVitalCloudMessage("拡張期血圧を入力してください。");
      return;
    }

    const weight = Number(weightText);
    const systolic = Number(systolicText);
    const diastolic = Number(diastolicText);

    if (!Number.isFinite(weight)) {
      setVitalCloudMessage("体重は数値で入力してください。");
      return;
    }
    if (!Number.isFinite(systolic)) {
      setVitalCloudMessage("収縮期血圧は数値で入力してください。");
      return;
    }
    if (!Number.isFinite(diastolic)) {
      setVitalCloudMessage("拡張期血圧は数値で入力してください。");
      return;
    }

    if (weight < 20 || weight > 200) {
      setVitalCloudMessage("体重は20〜200kgの範囲で入力してください。");
      return;
    }
    if (systolic < 50 || systolic > 250) {
      setVitalCloudMessage("収縮期血圧は50〜250の範囲で入力してください。");
      return;
    }
    if (diastolic < 30 || diastolic > 150) {
      setVitalCloudMessage("拡張期血圧は30〜150の範囲で入力してください。");
      return;
    }
    if (diastolic >= systolic) {
      setVitalCloudMessage("拡張期血圧は収縮期血圧より低く入力してください。");
      return;
    }

    setVitalCloudMessage("");
    const entry: VitalEntry = {
      id: crypto.randomUUID(),
      date: vitalDate,
      time: vitalTime,
      weight: weightText,
      systolic: systolicText,
      diastolic: diastolicText,
            
    };
    setVitals((prev) => [...prev, entry]);
    setWeightInput("");
    setSystolicInput("");
    setDiastolicInput("");
    setVitalTime(timeString());
  }

  function deleteVital(id: string) {
    setVitals((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <main className="page-bg">
      <div className="container">
        <div className="hero-card">
          <div className="hero-row">
            <div>
              <div className="hero-eyebrow">CKD 栄養管理アプリ 試作版</div>
              <h1 className="hero-title">腎臓ノート</h1>
              <div className="hero-text">
                科目の自作追加、スマホ対応、直近7日間グラフ、1週間まとめPDF印刷まで入れた版です。
              </div>
            </div>

            <div className="nav-wrap">
              <NavButton active={page === "dashboard"} label="表画面" onClick={() => setPage("dashboard")} />
              <NavButton active={page === "patient"} label="患者設定画面" onClick={() => setPage("patient")} />
              <NavButton active={page === "meal"} label="食事設定画面" onClick={() => setPage("meal")} />
            </div>
          </div>
        </div>

        {page === "dashboard" && (
          <div className="stack">
            <div className="top-filter">
              <label className="label-inline">表示日</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" />
            </div>

            <div className="dashboard-grid">
              <div className="stack">
                <SectionCard title="① 患者情報">
                  <div className="patient-grid">
                    <div>
                      {patient.photo ? (
                        <img src={patient.photo} alt="患者写真" className="patient-photo" />
                      ) : (
                        <div className="patient-photo empty">写真未設定</div>
                      )}
                    </div>
                    <div className="info-grid">
                      <SmallInfoCard label="患者名" value={patient.name || "未設定"} />
                      <SmallInfoCard label="年齢" value={patient.age ? `${patient.age}歳` : "未設定"} />
                      <SmallInfoCard label="eGFR" value={patient.egfr || "未設定"} />
                      <SmallInfoCard label="透析" value={patient.dialysis || "未設定"} />
                      <SmallInfoCard label="高カリウム血症" value={patient.highPotassium || "未設定"} />
                      <SmallInfoCard
                        label="主治医からの目標値"
                        value={
                          <div className="small-text">
                            {patient.targetKcal || "-"} kcal / {patient.targetProtein || "-"} g
                            <br />
                            Na {sodiumTargetMg || "-"} mg / K {patient.targetPotassium || "-"} mg
                          </div>
                        }
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="② 今日の記録">
                  <div className="stack">
                    <div className="grid-5">
                      <input type="date" value={vitalDate} onChange={(e) => setVitalDate(e.target.value)} className="input" />
                      <input type="time" value={vitalTime} onChange={(e) => setVitalTime(e.target.value)} className="input" />
                      <input placeholder="体重(kg)" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="input" />
                      <input placeholder="収縮期" value={systolicInput} onChange={(e) => setSystolicInput(e.target.value)} className="input" />
                      <div className="inline-row">
                        <input placeholder="拡張期" value={diastolicInput} onChange={(e) => setDiastolicInput(e.target.value)} className="input grow" />
                        <ActionButton label="追加" onClick={addVital} color="#0f172a" />
                      </div>
                    </div>

                    <div className="stack">
                      <SimpleLineChart title="体重の折れ線グラフ" values={weekVitalSeries.map((v) => ({ label: v.label, value: v.weight }))} color="#2563eb" unit="kg" />
                      <SimpleLineChart title="血圧（収縮期）の折れ線グラフ" values={weekVitalSeries.map((v) => ({ label: v.label, value: v.systolic }))} color="#ef4444" />
                      <SimpleLineChart title="血圧（拡張期）の折れ線グラフ" values={weekVitalSeries.map((v) => ({ label: v.label, value: v.diastolic }))} color="#f59e0b" />
                    </div>

                    <div>
                      <div className="sub-title">本日の記録一覧</div>
                      {todayVitals.length === 0 ? (
                        <div className="muted-text">まだ記録がありません。</div>
                      ) : (
                        <div className="stack-sm">
                          {todayVitals.map((v) => (
                            <div key={v.id} className="row-card">
                              <div className="small-text">
                                {v.time} / 体重 {v.weight || "-"} kg / 血圧 {v.systolic || "-"} - {v.diastolic || "-"}
                              </div>
                              <button onClick={() => deleteVital(v.id)} className="ghost-btn">削除</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="button-row">
                      <ActionButton label="Supabaseから読み込む" onClick={loadVitalsFromSupabase} color="#475569" />
                      <ActionButton label="Supabaseに保存する" onClick={saveVitalsToSupabase} color="#0284c7" />
                    </div>
                    {vitalCloudMessage ? (
                      <div className="muted-text">{vitalCloudMessage}</div>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard title="③ 食事記録">
                  <div className="stack">
                    <div className="notice-row">
                      <div>
                        <div className="sub-title">食品を入力したい時は食事設定画面へ</div>
                        <div className="muted-text">食品候補、既製品入力、記載されていない食品の追加をまとめています。</div>
                      </div>
                      <ActionButton label="食事設定画面へ" onClick={() => setPage("meal")} color="#0284c7" />
                    </div>

                    {currentLog.items.length === 0 ? (
                      <div className="muted-text">まだ食品が入力されていません。</div>
                    ) : (
                      <div className="stack-sm">
                        {currentLog.items.map((item) => (
                          <div key={item.id} className="row-card">
                            <div className="small-text">
                              <strong>{item.mealType}</strong> / [{item.subject}] {item.foodName} / {item.amountLabel}
                              <br />
                              <span className="muted-text">
                                {item.kcal} kcal / {item.protein} g / Na {item.sodium} mg / K {item.potassium} mg / {item.sourceType === "package" ? "既製品" : "候補"}
                              </span>
                            </div>
                            <button onClick={() => deleteMealItem(item.id)} className="ghost-btn">削除</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="button-row">
                      <ActionButton label="Supabaseから読み込む" onClick={loadMealItemsFromSupabase} color="#475569" />
                      <ActionButton label="Supabaseに保存する" onClick={saveMealItemsToSupabase} color="#0284c7" />
                    </div>
                    {mealCloudMessage ? (
                      <div className="muted-text">{mealCloudMessage}</div>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard title="④ 今日のまとめ">
                  <div className="stack">
                    <MetricBar label="カロリー" total={totals.kcal} target={patient.targetKcal} unit="kcal" mode="normal" />
                    <MetricBar label="たんぱく質" total={totals.protein} target={patient.targetProtein} unit="g" mode="normal" />
                    <MetricBar label="ナトリウム（mg換算）" total={totals.sodium} target={String(sodiumTargetMg || "")} unit="mg" mode="upper" />
                    <MetricBar label="カリウム" total={totals.potassium} target={patient.targetPotassium} unit="mg" mode="upper" />

                    <div className="memo-box">
                      <div className="sub-title">評価コメント</div>
                      <div className="stack-sm">
                        {summaryMessages.map((msg, index) => (
                          <div key={`${msg}-${index}`} className="comment-card">{msg}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="sub-title">メモ</div>
                      <textarea
                        value={memoInput}
                        onChange={(e) => setMemoInput(e.target.value)}
                        placeholder="食欲がなかった、外食した、むくみが気になった、など"
                        className="textarea"
                      />
                      <div className="top-gap button-row">
                        <ActionButton label="メモを保存" onClick={saveMemo} color="#7c3aed" />
                        <ActionButton label="Supabaseから読み込む" onClick={loadDailyLogFromSupabase} color="#475569" />
                        <ActionButton label="Supabaseに保存する" onClick={saveDailyLogToSupabase} color="#0284c7" />
                      </div>
                      {dailyLogCloudMessage ? (
                        <div className="muted-text top-gap">{dailyLogCloudMessage}</div>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="⑤ ダウンロード">
                  <div className="stack">
                    <div className="download-row">
                      <div className="muted-text">患者情報、食事記録、体重・血圧記録、メモをCSV形式で出力します。</div>
                      <ActionButton label="CSVをダウンロード" onClick={() => downloadCsv(patient, logs, vitals, selectedDate)} color="#ea580c" />
                    </div>
                    <div className="download-row">
                      <div className="muted-text">直近1週間の評価をA4一枚の印刷画面で開きます。印刷画面で「PDFに保存」を選べます。</div>
                      <ActionButton label="1週間のまとめ（PDF印刷）" onClick={() => openWeeklyPrint(patient, logs, vitals, selectedDate)} color="#0f766e" />
                    </div>
                  </div>
                </SectionCard>
              </div>

              <div className="stack">
                <SectionCard title="今日の食事は目標に対して多い？少ない？">
                  <div className="muted-text top-gap-sm">
                    今日の食事が、今の目標に対して多いのか、少ないのかを一目で確認できます。
                  </div>
                  <MetricBar label="カロリー" total={totals.kcal} target={patient.targetKcal} unit="kcal" mode="normal" />
                  <MetricBar label="たんぱく質" total={totals.protein} target={patient.targetProtein} unit="g" mode="normal" />
                  <MetricBar label="ナトリウム（mg換算）" total={totals.sodium} target={String(sodiumTargetMg || "")} unit="mg" mode="upper" />
                  <MetricBar label="カリウム" total={totals.potassium} target={patient.targetPotassium} unit="mg" mode="upper" />
                </SectionCard>

                <SectionCard title="更新ポイント">
                  <div className="muted-text">
                    科目は自分で追加できます。<br />
                    直近7日間のグラフ表示に変更しました。<br />
                    メモはCSVと1週間まとめの両方で見返せます。<br />
                    1週間まとめには、前向きになれるコメントを入れています。
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}

        {page === "patient" && (
          <div className="two-col">
            <SectionCard title="患者設定画面">
              <div className="stack">
                <div>
                  <div className="sub-title">患者写真</div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>

                <div className="subject-box" style={{ background: "#eff6ff" }}>
                  <div className="sub-title">Supabase 保存</div>
                  <div className="muted-text">ログイン中のメールアドレス: {authEmail || "未ログイン"}</div>
                  <div className="button-row">
                    <ActionButton label="Supabaseから読み込む" onClick={loadPatientFromSupabase} color="#0f766e" />
                    <ActionButton label="Supabaseに保存する" onClick={savePatientToSupabase} color="#2563eb" />
                  </div>
                  <div className="muted-text">{patientCloudMessage}</div>
                </div>

                <div className="grid-2">
                  <input placeholder="患者名" value={patient.name} onChange={(e) => savePatientField("name", e.target.value)} className="input" />
                  <input placeholder="年齢" value={patient.age} onChange={(e) => savePatientField("age", e.target.value)} className="input" />
                  <input placeholder="eGFR" value={patient.egfr} onChange={(e) => savePatientField("egfr", e.target.value)} className="input" />
                  <select value={patient.dialysis} onChange={(e) => savePatientField("dialysis", e.target.value)} className="input">
                    <option>なし</option>
                    <option>血液透析</option>
                    <option>腹膜透析</option>
                  </select>
                  <select value={patient.highPotassium} onChange={(e) => savePatientField("highPotassium", e.target.value)} className="input">
                    <option>なし</option>
                    <option>あり</option>
                  </select>
                </div>

                <div className="sub-title">主治医から言われた目標値</div>

                <div className="grid-2">
                  <input placeholder="目標カロリー(kcal)" value={patient.targetKcal} onChange={(e) => savePatientField("targetKcal", e.target.value)} className="input" />
                  <input placeholder="目標たんぱく質(g)" value={patient.targetProtein} onChange={(e) => savePatientField("targetProtein", e.target.value)} className="input" />
                  <input placeholder="目標ナトリウム(mg)" value={patient.targetSodium} onChange={(e) => savePatientField("targetSodium", e.target.value)} className="input" />
                  <input placeholder="目標カリウム(mg)" value={patient.targetPotassium} onChange={(e) => savePatientField("targetPotassium", e.target.value)} className="input" />
                </div>

                <div>
                  <ActionButton label="表画面へ戻る" onClick={() => setPage("dashboard")} color="#0f172a" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="この画面で設定するもの">
              <div className="muted-text">
                患者の写真、年齢、eGFR、透析の有無、高カリウム血症の有無、主治医から言われた目標値を設定します。患者設定だけは Supabase に保存できるようにしてあります。
              </div>
            </SectionCard>
          </div>
        )}

        {page === "meal" && (
          <div className="two-col">
            <SectionCard title="食事設定画面">
              <div className="stack">
                <div className="grid-2">
                  <div>
                    <div className="sub-title">日付</div>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" />
                  </div>

                  <div>
                    <div className="sub-title">食事区分</div>
                    <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="input">
                      <option>朝食</option>
                      <option>昼食</option>
                      <option>夕食</option>
                      <option>間食</option>
                    </select>
                  </div>
                </div>

                <div className="subject-box">
                  <div className="sub-title">科目を追加する</div>
                  <div className="inline-row">
                    <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="新しい科目名" className="input grow" />
                    <ActionButton label="科目を追加" onClick={addSubject} color="#475569" />
                  </div>
                  <div className="button-row top-gap">
                    <ActionButton label="Supabaseから読み込む" onClick={loadSubjectsAndFoodsFromSupabase} color="#475569" />
                    <ActionButton label="Supabaseに保存する" onClick={saveSubjectsAndFoodsToSupabase} color="#0284c7" />
                  </div>
                  {subjectFoodCloudMessage ? (
                    <div className="muted-text top-gap">{subjectFoodCloudMessage}</div>
                  ) : null}
                </div>

                <div className="subject-box subject-a">
                  <div className="sub-title">A. 食品候補から選ぶ</div>
                  <div className="stack-sm">
                    <div>
                      <div className="field-label">科目</div>
                      <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input">
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="field-label">食品候補</div>
                      <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)} className="input">
                        {filteredFoods.map((food) => (
                          <option key={food.id} value={food.id}>
                            [{food.subject}] {food.name}（{food.baseAmount}）
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="field-label">量の倍率</div>
                      <input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="例: 1、0.5、2" className="input" />
                    </div>
                  </div>

                  <div className="preview-box">
                    <div className="sub-title">自動計算結果</div>
                    <div className="info-grid">
                      <SmallInfoCard label="科目" value={selectedFood.subject} />
                      <SmallInfoCard label="食品名" value={selectedFood.name} />
                      <SmallInfoCard label="量" value={mealPreview.amountLabel} />
                      <SmallInfoCard label="カロリー" value={`${mealPreview.kcal} kcal`} />
                      <SmallInfoCard label="たんぱく質" value={`${mealPreview.protein} g`} />
                      <SmallInfoCard label="ナトリウム" value={`${mealPreview.sodium} mg`} />
                      <SmallInfoCard label="カリウム" value={`${mealPreview.potassium} mg`} />
                    </div>
                    {selectedFood.note ? <div className="note-text">{selectedFood.note}</div> : null}
                  </div>

                  <ActionButton label="この食品を追加" onClick={addMealItem} color="#16a34a" />
                </div>

                <div className="subject-box subject-b">
                  <div className="sub-title">B. 既製品を成分表から入力する</div>
                  <div className="stack-sm">
                    <div>
                      <div className="field-label">科目</div>
                      <select value={packageSubject} onChange={(e) => setPackageSubject(e.target.value)} className="input">
                        {subjects.filter((s) => s !== "すべて").map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    <input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="商品名 例: カップスープ" className="input" />
                    <div className="grid-2">
                      <input value={packageAmount} onChange={(e) => setPackageAmount(e.target.value)} placeholder="表示単位 例: 1食分、100g" className="input" />
                      <input value={packageServings} onChange={(e) => setPackageServings(e.target.value)} placeholder="何食分か 例: 1、0.5、2" className="input" />
                    </div>
                    <div className="grid-2">
                      <input value={packageKcal} onChange={(e) => setPackageKcal(e.target.value)} placeholder="熱量(kcal)" className="input" />
                      <input value={packageProtein} onChange={(e) => setPackageProtein(e.target.value)} placeholder="たんぱく質(g)" className="input" />
                      <input value={packageSaltEq} onChange={(e) => setPackageSaltEq(e.target.value)} placeholder="食塩相当量(g)" className="input" />
                      <input value={packagePotassium} onChange={(e) => setPackagePotassium(e.target.value)} placeholder="カリウム(mg) ※表示があれば" className="input" />
                    </div>
                  </div>

                  <div className="preview-box">
                    <div className="sub-title">成分表からの換算結果</div>
                    <div className="info-grid">
                      <SmallInfoCard label="科目" value={packageSubject} />
                      <SmallInfoCard label="商品名" value={packageName || "未入力"} />
                      <SmallInfoCard label="量" value={packagePreview.amountLabel} />
                      <SmallInfoCard label="カロリー" value={`${packagePreview.kcal} kcal`} />
                      <SmallInfoCard label="たんぱく質" value={`${packagePreview.protein} g`} />
                      <SmallInfoCard label="食塩相当量" value={`${packagePreview.saltEq} g`} />
                      <SmallInfoCard label="ナトリウム換算" value={`${packagePreview.sodium} mg`} />
                      <SmallInfoCard label="カリウム" value={`${packagePreview.potassium} mg`} />
                    </div>
                  </div>

                  <div className="button-row">
                    <ActionButton label="この既製品を追加" onClick={addPackageItem} color="#ea580c" />
                    {mealCloudMessage ? (
  <div className="muted-text">{mealCloudMessage}</div>
) : null}
                    <ActionButton label="候補にも保存" onClick={savePackageAsCandidate} color="#92400e" />
                  </div>
                </div>

                <div className="subject-box subject-c">
                  <div className="sub-title">C. 記載されていない食品を候補に追加する</div>
                  <div className="stack-sm">
                    <div>
                      <div className="field-label">科目</div>
                      <select value={customFoodSubject} onChange={(e) => setCustomFoodSubject(e.target.value)} className="input">
                        {subjects.filter((s) => s !== "すべて").map((subject) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid-2">
                      <input value={customFoodName} onChange={(e) => setCustomFoodName(e.target.value)} placeholder="食品名" className="input" />
                      <input value={customFoodAmount} onChange={(e) => setCustomFoodAmount(e.target.value)} placeholder="基本量 例: 1食分、100g" className="input" />
                    </div>
                    <div className="grid-2">
                      <input value={customFoodKcal} onChange={(e) => setCustomFoodKcal(e.target.value)} placeholder="カロリー(kcal)" className="input" />
                      <input value={customFoodProtein} onChange={(e) => setCustomFoodProtein(e.target.value)} placeholder="たんぱく質(g)" className="input" />
                      <input value={customFoodSodium} onChange={(e) => setCustomFoodSodium(e.target.value)} placeholder="ナトリウム(mg)" className="input" />
                      <input value={customFoodPotassium} onChange={(e) => setCustomFoodPotassium(e.target.value)} placeholder="カリウム(mg)" className="input" />
                    </div>
                  </div>

                  <div className="button-row">
                    <ActionButton label="候補に保存" onClick={saveCustomFood} color="#7c3aed" />
                    <ActionButton label="表画面へ戻る" onClick={() => setPage("dashboard")} color="#0f172a" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="この画面でできること">
              <div className="muted-text">
                科目はプルダウンにし、自分で追加できます。<br />
                記載されていない食品は候補として保存できます。<br />
                既製品は成分表入力後に、記録にも候補にも使えます。
              </div>
            </SectionCard>
          </div>
        )}

        <style jsx global>{`
          * { box-sizing: border-box; }
          body { margin: 0; }
          .page-bg { min-height: 100vh; background: #f8fafc; padding: 20px; font-family: sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; }
          .stack { display: grid; gap: 20px; }
          .stack-sm { display: grid; gap: 8px; }
          .hero-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .hero-row { display: flex; gap: 16px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
          .hero-eyebrow { color: #0369a1; font-weight: 700; font-size: 14px; }
          .hero-title { font-size: 34px; font-weight: 800; margin: 6px 0 8px; }
          .hero-text { color: #64748b; line-height: 1.6; }
          .nav-wrap { display: flex; gap: 8px; flex-wrap: wrap; }
          .nav-btn { padding: 10px 16px; border-radius: 12px; border: 1px solid #cbd5e1; background: white; color: #334155; cursor: pointer; font-weight: 600; }
          .nav-btn.active { border-color: #0f172a; background: #0f172a; color: white; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .section-title { font-size: 22px; font-weight: 700; margin: 0 0 16px; }
          .sub-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
          .field-label { font-size: 13px; color: #475569; margin-bottom: 4px; }
          .top-filter { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 16px; }
          .label-inline { font-weight: 700; margin-right: 12px; }
          .dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); gap: 20px; }
          .two-col { display: grid; gap: 20px; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr); }
          .patient-grid { display: grid; grid-template-columns: 120px 1fr; gap: 16px; align-items: start; }
          .patient-photo { width: 110px; height: 110px; object-fit: cover; border-radius: 20px; border: 1px solid #e2e8f0; }
          .patient-photo.empty { background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .small-card { background: #f8fafc; border-radius: 14px; padding: 12px; border: 1px solid #e2e8f0; }
          .small-card-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
          .small-card-value { font-weight: 600; }
          .small-text { font-size: 14px; line-height: 1.5; }
          .muted-text { color: #64748b; line-height: 1.7; font-size: 14px; }
          .input, select, textarea { width: 100%; padding: 10px; border-radius: 12px; border: 1px solid #cbd5e1; background: white; }
          .textarea { min-height: 100px; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .grid-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
          .inline-row { display: flex; gap: 8px; align-items: center; }
          .grow { flex: 1; min-width: 0; }
          .action-btn { color: white; border: none; border-radius: 12px; padding: 10px 16px; font-weight: 600; cursor: pointer; }
          .ghost-btn { padding: 6px 10px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; cursor: pointer; }
          .chart-box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #fff; }
          .chart-title { font-weight: 700; margin-bottom: 10px; }
          .chart-svg { width: 100%; height: 180px; }
          .row-card { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 12px; border-radius: 14px; border: 1px solid #e2e8f0; background: white; }
          .notice-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; }
          .metric-wrap { margin-bottom: 16px; }
          .metric-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 8px; }
          .metric-label { font-weight: 600; }
          .metric-sub { font-size: 13px; color: #64748b; }
          .metric-badge { border: 1px solid transparent; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
          .metric-track { width: 100%; height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
          .metric-fill { height: 100%; border-radius: 999px; }
          .memo-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; }
          .comment-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; }
          .download-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
          .subject-box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
          .subject-a { background: #f8fafc; }
          .subject-b { background: #fff7ed; }
          .subject-c { background: #faf5ff; }
          .preview-box { margin-top: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
          .button-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
          .note-text { margin-top: 8px; font-size: 12px; color: #64748b; }
          .top-gap { margin-top: 10px; }
          .top-gap-sm { margin-bottom: 16px; }

          @media (max-width: 900px) {
            .dashboard-grid, .two-col { grid-template-columns: 1fr; }
          }

          @media (max-width: 700px) {
            .page-bg { padding: 12px; }
            .hero-card { padding: 16px; }
            .hero-title { font-size: 28px; }
            .section-title { font-size: 20px; }
            .patient-grid { grid-template-columns: 1fr; }
            .info-grid, .grid-2, .grid-5 { grid-template-columns: 1fr; }
            .row-card, .download-row, .notice-row, .metric-head, .inline-row { align-items: stretch; flex-direction: column; }
            .chart-svg { height: 160px; }
          }
        `}</style>
      </div>
    </main>
  );
}
