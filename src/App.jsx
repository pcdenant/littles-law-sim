import { useState, useEffect, useRef, useCallback } from "react";

// ─── Brand palette ───────────────────────────────────────
const B = {
  vert: "#006946",
  vertLight: "#00875a",
  vertPale: "#e6f2ed",
  vertGlow: "rgba(0,105,70,0.12)",
  jaune: "#FFF200",
  jauneMuted: "#e6d900",
  jaunePale: "#fffde6",
  jauneGlow: "rgba(255,242,0,0.18)",
  creme: "#FBF3EB",
  cremeDeep: "#f3e8da",
  white: "#ffffff",
  text: "#1a2e23",
  textSoft: "#3d5a4a",
  textMuted: "#7a8f82",
  border: "#e4d9cd",
  borderLight: "#f0e6da",
  shadow: "0 1px 3px rgba(0,40,20,0.06), 0 6px 16px rgba(0,40,20,0.04)",
  shadowHover: "0 2px 8px rgba(0,40,20,0.08), 0 12px 28px rgba(0,40,20,0.06)",
  cyclePurple: "#6c5ce7",
  cyclePurplePale: "#f0eeff",
  cyclePurpleGlow: "rgba(108,92,231,0.12)",
  danger: "#d63031",
  dangerPale: "#fef0f0",
};

// ─── i18n ────────────────────────────────────────────────
const I18N = {
  fr: {
    title: "Loi de Little",
    titleSub: "Simulateur interactif",
    subtitle: "WIP = Throughput × Cycle Time",
    wipLabel: "WIP", wipSub: "En cours",
    tpLabel: "Throughput", tpSub: "Débit de sortie",
    ctLabel: "Cycle Time", ctSub: "Temps de traversée",
    items: "items",
    entry: "ENTRÉE ▸", done: "▸ TERMINÉ",
    legend: (u) => `Couleur = âge (vert → rouge). Chiffre = ${u} dans le système.`,
    controls: "Paramètres", pause: "Pause", resume: "Reprendre",
    wipSlider: "WIP (items en cours)",
    tpSlider: (u) => `Throughput (items/${u})`,
    coachingBtn: "Pourquoi c'est utile en coaching",
    coachingTitle: "En coaching, ça veut dire :",
    coachingP1: (tpC, wipC, ctC) =>
      <>Si le <span style={{ color: tpC, fontWeight: 700 }}>Throughput</span> ne change pas, augmenter le <span style={{ color: wipC, fontWeight: 700 }}>WIP</span> augmente mécaniquement le <span style={{ color: ctC, fontWeight: 700 }}>Cycle Time</span>.</>,
    coachingP2: "Plus d'items en parallèle = chaque item prend plus longtemps. Toujours.",
    coachingP3: (wipC) =>
      <>Le levier le plus rapide pour améliorer la prévisibilité : <strong style={{ color: wipC }}>réduire le WIP</strong>.</>,
    coachingTip: "Quand un manager demande \"pourquoi c'est si long ?\", la réponse est presque toujours : trop d'items en cours en même temps.",
    insightExcessive: "WIP excessif — le système est surchargé. Les items vieillissent, le Cycle Time explose. Réduire le WIP est le levier #1.",
    insightHigh: "WIP élevé — le Cycle Time dégrade la prévisibilité. Les engagements de date deviennent risqués.",
    insightGood: "WIP ≤ Throughput — système fluide. Cycle Time court, prévisibilité maximale. Zone cible.",
    insightOk: "Ratio correct. Si le Cycle Time augmente sans changement de Throughput, le WIP caché est le suspect.",
    unitLabel: "Unité", langLabel: "Langue",
    also: "soit",
    perDay: "/jour", perWeek: "/sem.", perMonth: "/mois",
    days: "jours", weeks: "sem.", months: "mois",
    tuDay: "Jours", tuWeek: "Semaines", tuMonth: "Mois",
    unitDay: "jour", unitDays: "jours",
    unitWeek: "sem.", unitWeeks: "sem.",
    unitMonth: "mois", unitMonths: "mois",
  },
  en: {
    title: "Little's Law",
    titleSub: "Interactive Simulator",
    subtitle: "WIP = Throughput × Cycle Time",
    wipLabel: "WIP", wipSub: "In progress",
    tpLabel: "Throughput", tpSub: "Output rate",
    ctLabel: "Cycle Time", ctSub: "Lead time",
    items: "items",
    entry: "IN ▸", done: "▸ DONE",
    legend: (u) => `Color = age (green → red). Number = ${u} in the system.`,
    controls: "Settings", pause: "Pause", resume: "Resume",
    wipSlider: "WIP (items in progress)",
    tpSlider: (u) => `Throughput (items/${u})`,
    coachingBtn: "Why this matters in coaching",
    coachingTitle: "In coaching, this means:",
    coachingP1: (tpC, wipC, ctC) =>
      <>If <span style={{ color: tpC, fontWeight: 700 }}>Throughput</span> stays the same, increasing <span style={{ color: wipC, fontWeight: 700 }}>WIP</span> mechanically increases <span style={{ color: ctC, fontWeight: 700 }}>Cycle Time</span>.</>,
    coachingP2: "More items in parallel = each item takes longer. Always.",
    coachingP3: (wipC) =>
      <>The fastest lever to improve predictability: <strong style={{ color: wipC }}>reduce WIP</strong>.</>,
    coachingTip: "When a manager asks \"why is it taking so long?\", the answer is almost always: too many items in progress at the same time.",
    insightExcessive: "Excessive WIP — the system is overloaded. Items age, Cycle Time explodes. Reducing WIP is lever #1.",
    insightHigh: "High WIP — Cycle Time is degrading predictability. Date commitments become risky.",
    insightGood: "WIP ≤ Throughput — smooth system. Short Cycle Time, maximum predictability. Target zone.",
    insightOk: "Decent ratio. If Cycle Time rises without a Throughput change, hidden WIP is the suspect.",
    unitLabel: "Unit", langLabel: "Lang",
    also: "i.e.",
    perDay: "/day", perWeek: "/wk", perMonth: "/mo",
    days: "days", weeks: "wks", months: "mos",
    tuDay: "Days", tuWeek: "Weeks", tuMonth: "Months",
    unitDay: "day", unitDays: "days",
    unitWeek: "wk", unitWeeks: "wks",
    unitMonth: "mo", unitMonths: "mos",
  },
};

const DAYS_PER = { day: 1, week: 5, month: 20 };

// ─── Shared styles ───────────────────────────────────────
const card = {
  background: B.white,
  borderRadius: 16,
  border: `1px solid ${B.border}`,
  boxShadow: B.shadow,
  overflow: "hidden",
};

const mono = "'JetBrains Mono', 'Fira Code', monospace";
const sans = "'DM Sans', 'Inter', system-ui, sans-serif";

// ─── Toggle Pill ─────────────────────────────────────────
function TogglePill({ options, value, onChange }) {
  return (
    <div style={{
      display: "inline-flex", borderRadius: 10, padding: 3,
      background: B.cremeDeep, gap: 2,
    }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: "4px 14px", fontSize: 11, fontWeight: 700,
          fontFamily: mono, border: "none", borderRadius: 8, cursor: "pointer",
          background: value === opt.value ? B.white : "transparent",
          color: value === opt.value ? B.vert : B.textMuted,
          boxShadow: value === opt.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          transition: "all 0.2s ease",
        }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Work Item ───────────────────────────────────────────
function WorkItem({ x, y, age, maxAge, size = 26 }) {
  const ratio = Math.min(age / Math.max(maxAge, 1), 1);
  const r = Math.round(0 + ratio * 214);
  const g = Math.round(105 - ratio * 57);
  const b = Math.round(70 - ratio * 21);
  const col = `rgb(${r},${g},${b})`;

  return (
    <div style={{
      position: "absolute", left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: 8,
      background: col, opacity: 0.9,
      transition: "left 0.3s ease, top 0.15s ease, background 0.5s ease",
      boxShadow: `0 2px 8px ${col}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: 800,
      color: ratio > 0.45 ? "#fff" : "#003d29",
      fontFamily: mono,
    }}>
      {Math.round(age)}
    </div>
  );
}

// ─── Slider ──────────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, color }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginBottom: 8, alignItems: "baseline",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: B.textMuted,
          letterSpacing: 0.6, textTransform: "uppercase", fontFamily: sans,
        }}>{label}</span>
        <span style={{
          fontSize: 20, fontWeight: 800, color,
          fontFamily: mono, lineHeight: 1,
        }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }}
      />
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: B.textMuted, marginTop: 3, fontFamily: mono,
      }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || !isFinite(n)) return "∞";
  if (n >= 100) return Math.round(n).toString();
  if (Number.isInteger(n)) return n.toString();
  return n < 0.1 ? n.toFixed(2) : n.toFixed(1);
};

// ─── Main ────────────────────────────────────────────────
export default function LittlesLawSimulation() {
  const [lang, setLang] = useState("fr");
  const [timeUnit, setTimeUnit] = useState("day");
  const [wip, setWip] = useState(8);
  const [throughputRaw, setThroughputRaw] = useState(4);
  const [items, setItems] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [running, setRunning] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const nextId = useRef(1);
  const pipeRef = useRef(null);

  const t = I18N[lang];
  const dp = DAYS_PER[timeUnit];
  const tpPerDay = throughputRaw / dp;
  const ctNative = tpPerDay > 0 ? wip / tpPerDay / dp : null;
  const ctDays = tpPerDay > 0 ? wip / tpPerDay : 999;
  const ctStr = ctNative !== null ? fmt(ctNative) : "∞";

  const unitLabels = {
    day:   { per: t.perDay,   ct: t.days },
    week:  { per: t.perWeek,  ct: t.weeks },
    month: { per: t.perMonth, ct: t.months },
  };
  const curUnit = unitLabels[timeUnit];
  const tuKey = timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1);
  const unitSingular = t[`unit${tuKey}`];

  const equivUnits = Object.keys(DAYS_PER).filter((u) => u !== timeUnit);
  const equivTP = equivUnits.map((u) => ({
    unit: u, tp: tpPerDay * DAYS_PER[u],
    ct: tpPerDay > 0 ? wip / tpPerDay / DAYS_PER[u] : null,
    perLabel: unitLabels[u].per, ctLabel: unitLabels[u].ct,
  }));

  const sliderConfig = {
    day: { min: 1, max: 30, step: 1 },
    week: { min: 1, max: 60, step: 1 },
    month: { min: 1, max: 120, step: 1 },
  };
  const sc = sliderConfig[timeUnit];

  const handleUnitChange = (newUnit) => {
    const newDp = DAYS_PER[newUnit];
    setThroughputRaw(Math.max(1, Math.round(tpPerDay * newDp)));
    setTimeUnit(newUnit);
  };

  // ─── Animation ───────────────────────────────────────
  const tick = useCallback(() => {
    setItems((prev) => {
      const pipeW = pipeRef.current?.offsetWidth || 600;
      const pipeH = pipeRef.current?.offsetHeight || 200;
      const padding = 24;
      const usableW = pipeW - padding * 2;
      const usableH = pipeH - padding * 2;
      let updated = prev.map((item) => ({
        ...item, age: item.age + 0.15,
        x: item.x + (usableW / (ctDays * 40)),
      }));
      const done = updated.filter((i) => i.x >= pipeW - padding);
      const remaining = updated.filter((i) => i.x < pipeW - padding);
      if (done.length > 0) setCompleted((c) => c + done.length);
      while (remaining.length < wip) {
        const rows = Math.ceil(Math.sqrt(wip));
        const row = remaining.length % rows;
        remaining.push({
          id: nextId.current++,
          x: padding + Math.random() * 30,
          y: padding + (row / rows) * usableH + (usableH / rows) * 0.5,
          age: 0,
        });
      }
      while (remaining.length > wip) remaining.pop();
      return remaining;
    });
  }, [wip, ctDays]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [tick, running]);

  // ─── Insight ─────────────────────────────────────────
  const ratio = throughputRaw > 0 ? wip / throughputRaw : 999;
  const getInsight = () => {
    if (ratio > 4) return { text: t.insightExcessive, icon: "⚠️", color: B.danger, bg: B.dangerPale };
    if (ratio > 2.5) return { text: t.insightHigh, icon: "⚡", color: "#b8860b", bg: B.jaunePale };
    if (ratio <= 1) return { text: t.insightGood, icon: "✦", color: B.vert, bg: B.vertPale };
    return { text: t.insightOk, icon: "→", color: B.textSoft, bg: B.creme };
  };
  const insight = getInsight();

  const langOptions = [{ value: "fr", label: "FR" }, { value: "en", label: "EN" }];
  const unitOptions = [
    { value: "day", label: t.tuDay },
    { value: "week", label: t.tuWeek },
    { value: "month", label: t.tuMonth },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: B.creme, color: B.text,
      fontFamily: sans, padding: "24px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* ═══ Header ═══ */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontSize: 26, fontWeight: 800, fontFamily: sans,
              margin: 0, color: B.vert, letterSpacing: -0.5, lineHeight: 1.1,
            }}>
              {t.title}
              <span style={{
                display: "inline-block", fontSize: 10, fontWeight: 700,
                background: B.jaune, color: B.text, padding: "2px 8px",
                borderRadius: 6, marginLeft: 10, verticalAlign: "middle",
                fontFamily: mono, letterSpacing: 0.5,
              }}>SIM</span>
            </h1>
            <p style={{ color: B.textMuted, fontSize: 13, margin: "4px 0 0", fontFamily: mono }}>{t.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <TogglePill options={langOptions} value={lang} onChange={setLang} />
            <TogglePill options={unitOptions} value={timeUnit} onChange={handleUnitChange} />
          </div>
        </div>

        {/* ═══ Bento Grid ═══ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.2fr",
          gridTemplateRows: "auto auto auto auto",
          gap: 12,
        }}>

          {/* ── Metric: WIP ── */}
          <div style={{ ...card, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: -20, right: -20, width: 80, height: 80,
              borderRadius: "50%", background: B.jauneGlow,
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                {t.wipLabel}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: "#b8860b", fontFamily: mono, lineHeight: 1 }}>
                {wip}
              </div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>{t.items} · {t.wipSub}</div>
            </div>
          </div>

          {/* ── Metric: Throughput ── */}
          <div style={{ ...card, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: -20, right: -20, width: 80, height: 80,
              borderRadius: "50%", background: B.vertGlow,
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                {t.tpLabel}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: B.vert, fontFamily: mono, lineHeight: 1 }}>
                {throughputRaw}
              </div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>{t.items}{curUnit.per} · {t.tpSub}</div>
            </div>
          </div>

          {/* ── Metric: Cycle Time (larger) ── */}
          <div style={{
            ...card, padding: "20px 18px", position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, ${B.white} 60%, ${B.cyclePurplePale})`,
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20, width: 80, height: 80,
              borderRadius: "50%", background: B.cyclePurpleGlow,
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                {t.ctLabel}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: B.cyclePurple, fontFamily: mono, lineHeight: 1 }}>
                {ctStr}
              </div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>{curUnit.ct} · {t.ctSub}</div>
            </div>
          </div>

          {/* ── Equivalences (full width) ── */}
          <div style={{
            gridColumn: "1 / -1",
            ...card, padding: "10px 18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, flexWrap: "wrap",
            fontFamily: mono, fontSize: 12, color: B.textMuted,
            background: B.white,
          }}>
            <span style={{ opacity: 0.6, fontSize: 11 }}>{t.also}</span>
            {equivTP.map((eq, i) => (
              <span key={eq.unit}>
                {i > 0 && <span style={{ margin: "0 4px", opacity: 0.3 }}>·</span>}
                <span style={{ color: B.vert, fontWeight: 700 }}>{fmt(eq.tp)}</span>
                <span>{eq.perLabel}</span>
                <span style={{ margin: "0 3px", opacity: 0.3 }}>=</span>
                <span style={{ color: B.cyclePurple, fontWeight: 700 }}>{eq.ct !== null ? fmt(eq.ct) : "∞"}</span>
                <span> {eq.ctLabel}</span>
              </span>
            ))}
            <span style={{ margin: "0 4px", opacity: 0.3 }}>│</span>
            <span style={{ fontSize: 11 }}>
              <span style={{ color: "#b8860b", fontWeight: 700 }}>{wip}</span>
              {" = "}
              <span style={{ color: B.vert, fontWeight: 700 }}>{throughputRaw}</span>
              {" × "}
              <span style={{ color: B.cyclePurple, fontWeight: 700 }}>{ctStr}</span>
              {" ✓"}
            </span>
          </div>

          {/* ── Pipeline (full width) ── */}
          <div style={{ gridColumn: "1 / -1", ...card }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 16px 0", fontSize: 10, color: B.textMuted,
              fontWeight: 700, letterSpacing: 1, fontFamily: mono,
            }}>
              <span>{t.entry}</span>
              <span style={{ color: B.vert }}>{t.done} ({completed})</span>
            </div>
            <div
              ref={pipeRef}
              style={{
                position: "relative", height: 170, margin: "6px 10px 4px",
                borderRadius: 12,
                background: `linear-gradient(90deg, ${B.creme} 0%, ${B.cremeDeep}44 100%)`,
                border: `1px solid ${B.borderLight}`,
                overflow: "hidden",
              }}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((pct) => (
                <div key={pct} style={{
                  position: "absolute", left: `${pct * 100}%`, top: 0, bottom: 0,
                  width: 1, background: B.borderLight,
                }} />
              ))}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", fontSize: 36,
                color: B.border, fontFamily: mono,
                pointerEvents: "none", userSelect: "none", opacity: 0.4,
              }}>
                → → →
              </div>
              {items.map((item) => (
                <WorkItem key={item.id} x={item.x} y={item.y} age={item.age} maxAge={ctDays * 6} />
              ))}
            </div>
            <div style={{
              padding: "4px 16px 10px", fontSize: 10,
              color: B.textMuted, textAlign: "center", fontFamily: sans,
            }}>
              {t.legend(curUnit.ct)}
            </div>
          </div>

          {/* ── Controls (2 cols) ── */}
          <div style={{ gridColumn: "1 / 3", ...card, padding: "18px 20px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
                textTransform: "uppercase", color: B.textMuted,
              }}>{t.controls}</span>
              <button onClick={() => setRunning(!running)} style={{
                background: running ? B.dangerPale : B.vertPale,
                color: running ? B.danger : B.vert,
                border: `1.5px solid ${running ? B.danger : B.vert}33`,
                borderRadius: 10, padding: "6px 16px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: mono,
                transition: "all 0.2s",
              }}>
                {running ? `■ ${t.pause}` : `▶ ${t.resume}`}
              </button>
            </div>
            <Slider label={t.wipSlider} value={wip} onChange={setWip} min={1} max={30} step={1} color="#b8860b" />
            <Slider label={t.tpSlider(unitSingular)} value={throughputRaw} onChange={setThroughputRaw} min={sc.min} max={sc.max} step={sc.step} color={B.vert} />
          </div>

          {/* ── Insight (1 col) ── */}
          <div style={{
            ...card, padding: "18px 16px",
            background: insight.bg, borderColor: `${insight.color}22`,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <div style={{
              fontSize: 22, marginBottom: 8, lineHeight: 1,
            }}>{insight.icon}</div>
            <div style={{
              fontSize: 13, lineHeight: 1.6, color: insight.color, fontWeight: 500,
            }}>
              {insight.text}
            </div>
          </div>

          {/* ── Coaching (full width) ── */}
          <div style={{ gridColumn: "1 / -1" }}>
            <button onClick={() => setShowFormula(!showFormula)} style={{
              width: "100%", ...card,
              padding: "14px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, fontWeight: 600, color: B.textSoft,
              textAlign: "left", fontFamily: sans,
              border: `1px solid ${B.border}`,
              transition: "box-shadow 0.2s",
            }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: 8,
                background: B.vertPale, color: B.vert, fontSize: 12,
                fontFamily: mono, fontWeight: 800, flexShrink: 0,
              }}>
                {showFormula ? "−" : "+"}
              </span>
              {t.coachingBtn}
            </button>

            {showFormula && (
              <div style={{
                ...card, marginTop: -1,
                borderTopLeftRadius: 0, borderTopRightRadius: 0,
                padding: 24, fontSize: 14, lineHeight: 1.8, color: B.textSoft,
              }}>
                <div style={{
                  marginBottom: 20, padding: 16, background: B.creme,
                  borderRadius: 12, fontFamily: mono, textAlign: "center",
                  fontSize: 18, color: B.text, fontWeight: 600,
                }}>
                  <span style={{ color: "#b8860b" }}>WIP</span>{" = "}
                  <span style={{ color: B.vert }}>Throughput</span>{" × "}
                  <span style={{ color: B.cyclePurple }}>Cycle Time</span>
                </div>
                <p style={{ margin: "0 0 12px", fontWeight: 700, color: B.text }}>{t.coachingTitle}</p>
                <p style={{ margin: "0 0 10px" }}>→ {t.coachingP1(B.vert, "#b8860b", B.cyclePurple)}</p>
                <p style={{ margin: "0 0 10px" }}>→ {t.coachingP2}</p>
                <p style={{ margin: "0 0 10px" }}>→ {t.coachingP3("#b8860b")}</p>
                <div style={{
                  marginTop: 16, paddingTop: 14,
                  borderTop: `1px solid ${B.border}`,
                  fontSize: 13, color: B.textMuted, fontStyle: "italic",
                }}>
                  💡 {t.coachingTip}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Footer ═══ */}
        <div style={{
          marginTop: 28, paddingTop: 16,
          borderTop: `1px solid ${B.border}`,
          textAlign: "center", fontSize: 11,
          color: B.textMuted, fontFamily: mono,
          letterSpacing: 0.3, lineHeight: 1.6,
        }}>
          {lang === "fr" ? "Un outil" : "A tool by"}{" "}
          <a href="https://collaborationsolved.com" target="_blank" rel="noopener noreferrer"
            style={{ color: B.vert, textDecoration: "none", fontWeight: 700 }}>
            Collaboration Solved
          </a>
          {" "}{lang === "fr" ? "par" : "by"} Pierre-Cyril Denant — 2026
        </div>
      </div>
    </div>
  );
}