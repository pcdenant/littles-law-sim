import { useState, useEffect, useRef, useCallback } from "react";

// ─── i18n ────────────────────────────────────────────────
const I18N = {
  fr: {
    title: "Loi de Little — Simulateur",
    subtitle: "WIP = Throughput × Cycle Time",
    wipLabel: "WIP",
    wipSub: "En cours",
    tpLabel: "Throughput",
    tpSub: "Débit de sortie",
    ctLabel: "Cycle Time",
    ctSub: "Temps de traversée",
    items: "items",
    entry: "ENTRÉE ▸",
    done: "▸ TERMINÉ",
    legend: (u) => `Couleur = âge de l'item (vert → rouge). Chiffre = ${u} dans le système.`,
    controls: "Contrôles",
    pause: "⏸ Pause",
    resume: "▶ Reprendre",
    wipSlider: "WIP (items en cours)",
    tpSlider: (u) => `Throughput (items/${u})`,
    coachingBtn: "POURQUOI C'EST UTILE EN COACHING",
    coachingTitle: "En coaching, ça veut dire :",
    coachingP1: (tpC, wipC, ctC) =>
      <>→ Si le <span style={{ color: tpC }}>Throughput</span> ne change pas, augmenter le <span style={{ color: wipC }}>WIP</span> augmente mécaniquement le <span style={{ color: ctC }}>Cycle Time</span>.</>,
    coachingP2: "→ Plus d'items en parallèle = chaque item prend plus longtemps. Toujours.",
    coachingP3: (wipC) =>
      <>→ Le levier le plus rapide pour améliorer la prévisibilité : <strong style={{ color: wipC }}>réduire le WIP</strong>.</>,
    coachingTip: "💡 Quand un manager demande \"pourquoi c'est si long ?\", la réponse est presque toujours : trop d'items en cours en même temps.",
    insightExcessive: "⚠ WIP excessif — le système est surchargé. Les items vieillissent, le Cycle Time explose. Réduire le WIP est le levier #1.",
    insightHigh: "🔶 WIP élevé — le Cycle Time commence à dégrader la prévisibilité. C'est là que les engagements de date deviennent risqués.",
    insightGood: "✅ WIP ≤ Throughput — système fluide. Cycle Time court, prévisibilité maximale. C'est la zone cible.",
    insightOk: "👍 Ratio correct. Surveillez le Cycle Time — s'il augmente sans changement de Throughput, le WIP caché est le suspect.",
    unitLabel: "Unité",
    langLabel: "Langue",
    also: "soit",
    perDay: "/jour",
    perWeek: "/sem.",
    perMonth: "/mois",
    days: "jours",
    weeks: "sem.",
    months: "mois",
    tuDay: "Jours",
    tuWeek: "Semaines",
    tuMonth: "Mois",
  },
  en: {
    title: "Little's Law — Simulator",
    subtitle: "WIP = Throughput × Cycle Time",
    wipLabel: "WIP",
    wipSub: "In progress",
    tpLabel: "Throughput",
    tpSub: "Output rate",
    ctLabel: "Cycle Time",
    ctSub: "Lead time",
    items: "items",
    entry: "IN ▸",
    done: "▸ DONE",
    legend: (u) => `Color = item age (green → red). Number = ${u} in the system.`,
    controls: "Controls",
    pause: "⏸ Pause",
    resume: "▶ Resume",
    wipSlider: "WIP (items in progress)",
    tpSlider: (u) => `Throughput (items/${u})`,
    coachingBtn: "WHY THIS MATTERS IN COACHING",
    coachingTitle: "In coaching, this means:",
    coachingP1: (tpC, wipC, ctC) =>
      <>→ If <span style={{ color: tpC }}>Throughput</span> stays the same, increasing <span style={{ color: wipC }}>WIP</span> mechanically increases <span style={{ color: ctC }}>Cycle Time</span>.</>,
    coachingP2: "→ More items in parallel = each item takes longer. Always.",
    coachingP3: (wipC) =>
      <>→ The fastest lever to improve predictability: <strong style={{ color: wipC }}>reduce WIP</strong>.</>,
    coachingTip: "💡 When a manager asks \"why is it taking so long?\", the answer is almost always: too many items in progress at the same time.",
    insightExcessive: "⚠ Excessive WIP — the system is overloaded. Items age, Cycle Time explodes. Reducing WIP is lever #1.",
    insightHigh: "🔶 High WIP — Cycle Time is starting to degrade predictability. Date commitments become risky.",
    insightGood: "✅ WIP ≤ Throughput — smooth system. Short Cycle Time, maximum predictability. Target zone.",
    insightOk: "👍 Decent ratio. Watch Cycle Time — if it rises without a Throughput change, hidden WIP is the suspect.",
    unitLabel: "Unit",
    langLabel: "Language",
    also: "i.e.",
    perDay: "/day",
    perWeek: "/wk",
    perMonth: "/mo",
    days: "days",
    weeks: "wks",
    months: "mos",
    tuDay: "Days",
    tuWeek: "Weeks",
    tuMonth: "Months",
  },
};

// Working-day conversions
const DAYS_PER = { day: 1, week: 5, month: 20 };

// ─── Colors ──────────────────────────────────────────────
const C = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceLight: "#1a2236",
  border: "#2a3550",
  text: "#e2e8f0",
  textMuted: "#7a8ba8",
  throughput: "#10b981",
  throughputDim: "rgba(16,185,129,0.15)",
  wip: "#f59e0b",
  wipDim: "rgba(245,158,11,0.15)",
  cycleTime: "#6366f1",
  cycleTimeDim: "rgba(99,102,241,0.15)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
};

// ─── Toggle Group ────────────────────────────────────────
function ToggleGroup({ options, value, onChange, color = C.text }) {
  return (
    <div style={{
      display: "inline-flex", borderRadius: 8, overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px", fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace", border: "none",
            borderRight: i < options.length - 1 ? `1px solid ${C.border}` : "none",
            cursor: "pointer",
            background: value === opt.value ? `${color}22` : C.surfaceLight,
            color: value === opt.value ? color : C.textMuted,
            transition: "all 0.15s ease",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Work Item ───────────────────────────────────────────
function WorkItem({ x, y, age, maxAge, size = 28 }) {
  const ratio = Math.min(age / Math.max(maxAge, 1), 1);
  const r = Math.round(16 + ratio * 223);
  const g = Math.round(185 - ratio * 117);
  const b = Math.round(129 - ratio * 60);
  const col = `rgb(${r},${g},${b})`;

  return (
    <div style={{
      position: "absolute", left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: 6,
      background: col, opacity: 0.85,
      transition: "left 0.3s ease, top 0.15s ease, background 0.5s ease",
      boxShadow: `0 0 12px ${col}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 700,
      color: ratio > 0.5 ? "#fff" : "#064e3b",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {Math.round(age)}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────
function MetricCard({ label, value, unit, color, dimColor, icon, subtitle }) {
  return (
    <div style={{
      background: dimColor, border: `1px solid ${color}33`,
      borderRadius: 12, padding: "14px 16px", flex: 1, minWidth: 130,
    }}>
      <div style={{
        fontSize: 11, color: C.textMuted, fontWeight: 600,
        letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
      }}>
        {icon} {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800, color,
        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1,
      }}>
        {value}
        <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginLeft: 4 }}>{unit}</span>
      </div>
      {subtitle && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Slider ──────────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: C.textMuted,
          letterSpacing: 0.8, textTransform: "uppercase",
        }}>{label}</span>
        <span style={{
          fontSize: 14, fontWeight: 700, color,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }}
      />
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: C.textMuted, marginTop: 2,
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

  // throughputRaw = items per selected unit (native input)
  // Convert to items/day for internal math
  const tpPerDay = throughputRaw / dp;

  // Cycle time in the selected unit
  const ctNative = tpPerDay > 0 ? wip / tpPerDay / dp : null;
  // Cycle time in days (for animation)
  const ctDays = tpPerDay > 0 ? wip / tpPerDay : 999;

  const ctStr = ctNative !== null ? fmt(ctNative) : "∞";

  // Unit label for the selected unit
  const unitLabels = {
    day:   { per: t.perDay,   ct: t.days },
    week:  { per: t.perWeek,  ct: t.weeks },
    month: { per: t.perMonth, ct: t.months },
  };
  const curUnit = unitLabels[timeUnit];

  // Equivalences: convert to the OTHER two units
  const equivUnits = Object.keys(DAYS_PER).filter((u) => u !== timeUnit);
  const equivTP = equivUnits.map((u) => ({
    unit: u,
    tp: tpPerDay * DAYS_PER[u],
    ct: tpPerDay > 0 ? wip / tpPerDay / DAYS_PER[u] : null,
    perLabel: unitLabels[u].per,
    ctLabel: unitLabels[u].ct,
  }));

  // Slider config per unit
  const sliderConfig = {
    day:   { min: 1, max: 30, step: 1 },
    week:  { min: 1, max: 60, step: 1 },
    month: { min: 1, max: 120, step: 1 },
  };
  const sc = sliderConfig[timeUnit];

  // Clamp throughput when switching units
  const handleUnitChange = (newUnit) => {
    const newDp = DAYS_PER[newUnit];
    // Convert current throughput to new unit, rounded
    const converted = Math.max(1, Math.round(tpPerDay * newDp));
    setThroughputRaw(converted);
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
        ...item,
        age: item.age + 0.15,
        x: item.x + (usableW / (ctDays * 40)),
      }));

      const done = updated.filter((i) => i.x >= pipeW - padding);
      const remaining = updated.filter((i) => i.x < pipeW - padding);

      if (done.length > 0) {
        setCompleted((c) => c + done.length);
      }

      while (remaining.length < wip) {
        const rows = Math.ceil(Math.sqrt(wip));
        const idx = remaining.length;
        const row = idx % rows;
        remaining.push({
          id: nextId.current++,
          x: padding + Math.random() * 30,
          y: padding + (row / rows) * usableH + (usableH / rows) * 0.5,
          age: 0,
        });
      }

      while (remaining.length > wip) {
        remaining.pop();
      }

      return remaining;
    });
  }, [wip, ctDays]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [tick, running]);

  // ─── Insight ─────────────────────────────────────────
  // Compare in native units: wip vs throughputRaw
  const ratio = throughputRaw > 0 ? wip / throughputRaw : 999;
  const getInsight = () => {
    if (ratio > 4) return { text: t.insightExcessive, color: C.danger };
    if (ratio > 2.5) return { text: t.insightHigh, color: C.wip };
    if (ratio <= 1) return { text: t.insightGood, color: C.throughput };
    return { text: t.insightOk, color: C.text };
  };
  const insight = getInsight();

  // ─── Toggle options ──────────────────────────────────
  const langOptions = [
    { value: "fr", label: "FR" },
    { value: "en", label: "EN" },
  ];
  const unitOptions = [
    { value: "day", label: t.tuDay },
    { value: "week", label: t.tuWeek },
    { value: "month", label: t.tuMonth },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
      padding: "20px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: -0.5, margin: 0,
            background: `linear-gradient(135deg, ${C.wip}, ${C.throughput})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t.title}
          </h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>{t.subtitle}</p>
        </div>

        {/* Toggles */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.textMuted,
              letterSpacing: 1, textTransform: "uppercase",
            }}>{t.langLabel}</span>
            <ToggleGroup options={langOptions} value={lang} onChange={setLang} color={C.cycleTime} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.textMuted,
              letterSpacing: 1, textTransform: "uppercase",
            }}>{t.unitLabel}</span>
            <ToggleGroup options={unitOptions} value={timeUnit} onChange={handleUnitChange} color={C.throughput} />
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <MetricCard label={t.wipLabel} value={wip} unit={t.items} color={C.wip} dimColor={C.wipDim} icon="◼" subtitle={t.wipSub} />
          <MetricCard label={t.tpLabel} value={throughputRaw} unit={curUnit.per} color={C.throughput} dimColor={C.throughputDim} icon="▶" subtitle={t.tpSub} />
          <MetricCard label={t.ctLabel} value={ctStr} unit={curUnit.ct} color={C.cycleTime} dimColor={C.cycleTimeDim} icon="◷" subtitle={t.ctSub} />
        </div>

        {/* Equivalences line */}
        <div style={{
          textAlign: "center", marginBottom: 16, padding: "8px 12px",
          background: C.surfaceLight, borderRadius: 10,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.textMuted,
          lineHeight: 1.8,
        }}>
          <span style={{ color: C.textMuted, opacity: 0.7, marginRight: 6 }}>{t.also}</span>
          {equivTP.map((eq, i) => (
            <span key={eq.unit}>
              {i > 0 && <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>}
              <span style={{ color: C.throughput }}>{fmt(eq.tp)}</span>
              <span>{eq.perLabel}</span>
              <span style={{ margin: "0 3px", opacity: 0.4 }}>=</span>
              <span style={{ color: C.cycleTime }}>{eq.ct !== null ? fmt(eq.ct) : "∞"}</span>
              <span> {eq.ctLabel}</span>
            </span>
          ))}
        </div>

        {/* Verification */}
        <div style={{
          textAlign: "center", marginBottom: 16,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.textMuted,
        }}>
          <span style={{ color: C.wip }}>{wip}</span>
          {" = "}
          <span style={{ color: C.throughput }}>{throughputRaw}</span>
          {" × "}
          <span style={{ color: C.cycleTime }}>{ctStr}</span>
          {" → "}
          <span style={{ color: C.text, fontWeight: 700 }}>
            {ctNative !== null ? fmt(Math.round(throughputRaw * ctNative * 100) / 100) : "∞"}
          </span>
          {" ✓"}
        </div>

        {/* Pipeline */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 2, marginBottom: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 14px 0", fontSize: 10, color: C.textMuted,
            fontWeight: 600, letterSpacing: 1,
          }}>
            <span>{t.entry}</span>
            <span style={{ color: C.throughput }}>{t.done} ({completed})</span>
          </div>
          <div
            ref={pipeRef}
            style={{
              position: "relative", height: 180, margin: 8, borderRadius: 10,
              background: `repeating-linear-gradient(90deg, ${C.surfaceLight} 0px, ${C.surfaceLight} 59px, ${C.border}22 59px, ${C.border}22 60px)`,
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", fontSize: 48,
              color: `${C.border}44`,
              fontFamily: "'JetBrains Mono', monospace",
              pointerEvents: "none", userSelect: "none",
            }}>
              →→→
            </div>
            {items.map((item) => (
              <WorkItem key={item.id} x={item.x} y={item.y} age={item.age} maxAge={ctDays * 6} />
            ))}
          </div>
          <div style={{
            padding: "2px 14px 8px", fontSize: 10,
            color: C.textMuted, textAlign: "center",
          }}>
            {t.legend(curUnit.ct)}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: 20, marginBottom: 16,
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14,
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              textTransform: "uppercase", color: C.textMuted,
            }}>{t.controls}</span>
            <button
              onClick={() => setRunning(!running)}
              style={{
                background: running ? C.dangerDim : C.throughputDim,
                color: running ? C.danger : C.throughput,
                border: `1px solid ${running ? C.danger : C.throughput}44`,
                borderRadius: 8, padding: "6px 14px", fontSize: 12,
                fontWeight: 700, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {running ? t.pause : t.resume}
            </button>
          </div>
          <Slider label={t.wipSlider} value={wip} onChange={setWip} min={1} max={30} step={1} color={C.wip} />
          <Slider
            label={t.tpSlider(curUnit.per.replace("/", ""))}
            value={throughputRaw}
            onChange={setThroughputRaw}
            min={sc.min} max={sc.max} step={sc.step}
            color={C.throughput}
          />
        </div>

        {/* Insight */}
        <div style={{
          background: `${insight.color}11`, border: `1px solid ${insight.color}33`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 16,
          fontSize: 13, lineHeight: 1.6, color: insight.color,
        }}>
          {insight.text}
        </div>

        {/* Coaching section */}
        <button
          onClick={() => setShowFormula(!showFormula)}
          style={{
            width: "100%", background: C.surfaceLight,
            border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "12px 18px", color: C.textMuted, fontSize: 12,
            fontWeight: 600, cursor: "pointer", textAlign: "left",
            letterSpacing: 0.5,
          }}
        >
          {showFormula ? "▾" : "▸"} {t.coachingBtn}
        </button>

        {showFormula && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderTop: "none", borderRadius: "0 0 12px 12px",
            padding: 20, fontSize: 13, lineHeight: 1.75, color: C.textMuted,
          }}>
            <div style={{
              marginBottom: 16, padding: 14, background: C.bg,
              borderRadius: 10, fontFamily: "'JetBrains Mono', monospace",
              textAlign: "center", fontSize: 16, color: C.text,
            }}>
              <span style={{ color: C.wip }}>WIP</span>{" = "}
              <span style={{ color: C.throughput }}>Throughput</span>{" × "}
              <span style={{ color: C.cycleTime }}>Cycle Time</span>
            </div>
            <p style={{ margin: "0 0 10px" }}>
              <strong style={{ color: C.text }}>{t.coachingTitle}</strong>
            </p>
            <p style={{ margin: "0 0 8px" }}>{t.coachingP1(C.throughput, C.wip, C.cycleTime)}</p>
            <p style={{ margin: "0 0 8px" }}>{t.coachingP2}</p>
            <p style={{ margin: "0 0 8px" }}>{t.coachingP3(C.wip)}</p>
            <p style={{
              margin: "0 0 0", paddingTop: 10,
              borderTop: `1px solid ${C.border}`, fontSize: 12,
            }}>
              {t.coachingTip}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: `1px solid ${C.border}`,
          textAlign: "center", fontSize: 11,
          color: C.textMuted, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 0.3, lineHeight: 1.6,
        }}>
          {lang === "fr" ? "Un outil" : "A tool by"}{" "}
          <a
            href="https://collaborationsolved.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.throughput, textDecoration: "none", fontWeight: 700 }}
          >
            Collaboration Solved
          </a>
          {" "}{lang === "fr" ? "par" : "by"} Pierre-Cyril Denant — 2026
        </div>
      </div>
    </div>
  );
}