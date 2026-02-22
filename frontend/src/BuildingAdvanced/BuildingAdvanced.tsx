import { useEffect, useMemo, useState } from "react";
import "./BuildingAdvanced.css";

interface Building {
  id?: number;
  name: string;
  address: string;
  anskaffelse: number;
  lejeindtægter: number;
  omkostninger_i_alt: number;
}

interface FinansSettings {
  globalRente: number;
  globalBelaaning: number;
  overrides: Record<number, { rente?: number; belaaning?: number }>;
}

function loadFinans(): FinansSettings {
  try {
    const saved = localStorage.getItem("analyse-finans");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { globalRente: 4.5, globalBelaaning: 80, overrides: {} };
}

function getSavedIds(): number[] {
  try {
    const saved = localStorage.getItem("analyse-ids");
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function getBelaaning(f: FinansSettings, id: number): number {
  return f.overrides[id]?.belaaning ?? f.globalBelaaning;
}

function fmtKr(val: number) {
  const n = Number(val) || 0;
  return n.toLocaleString("da-DK") + " kr";
}

function pct(val: number) {
  const n = Number(val) || 0;
  return n.toFixed(2).replace(".", ",") + " %";
}

type Scenarios = {
  rente_values: number[];
  belaaning_values: number[];
  cash_flow: number[][];
  cash_on_cash: number[][];
  overskud_foer_renter: number;
};

function nearestIndex(arr: number[] | undefined, val: number) {
  if (!arr || arr.length === 0) return -1;

  let bestI = 0;
  let bestD = Math.abs(arr[0] - val);

  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i] - val);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}

// kun til matrix-tab (backend grid)
function atMatrix(s: Scenarios | null, rente: number, bel: number) {
  if (!s) return null;

  const ri = nearestIndex(s.rente_values, rente);
  const bi = nearestIndex(s.belaaning_values, bel);
  if (ri < 0 || bi < 0) return null;

  return {
    cf: s.cash_flow?.[ri]?.[bi],
    coc: s.cash_on_cash?.[ri]?.[bi],
    usedRente: s.rente_values[ri],
    usedBel: s.belaaning_values[bi],
  };
}

export default function BuildingAdvanced() {
  const [tab, setTab] = useState<"stress" | "scenarios" | "future">("stress");
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(getSavedIds);
  const [finans] = useState<FinansSettings>(loadFinans);
  const [scenariosMap, setScenariosMap] = useState<Record<number, Scenarios | null>>({});
  const [loading, setLoading] = useState(true);

  // stress settings
  const [stressRente, setStressRente] = useState(6);
  const [stressBelaaning, setStressBelaaning] = useState<number | "fromAnalyse">("fromAnalyse");

  // future settings
  const [futureInflation, setFutureInflation] = useState(2.0);
  const [futureRente, setFutureRente] = useState(6.0);
  const [futureYears, setFutureYears] = useState(30);

  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then((res) => res.json())
      .then(setAllBuildings)
      .catch(() => setAllBuildings([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => allBuildings.filter((b) => b.id && selectedIds.includes(b.id)),
    [allBuildings, selectedIds],
  );

  useEffect(() => {
    selected.forEach((b) => {
      const id = b.id!;
      if (scenariosMap[id] !== undefined) return;

      fetch(`http://localhost:5000/api/buildings/${id}/scenarios`)
        .then((res) => res.json())
        .then((data) => setScenariosMap((p) => ({ ...p, [id]: data })))
        .catch(() => setScenariosMap((p) => ({ ...p, [id]: null })));
    });
  }, [selectedIds, allBuildings]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("analyse-ids", JSON.stringify(next));
      return next;
    });
  }

  // direkte stress calc (så 400% virker)
  function stressCalc(b: Building, belPct: number, rentePct: number) {
    const ansk = Number(b.anskaffelse) || 0;
    const leje = Number(b.lejeindtægter) || 0;
    const omk = Number(b.omkostninger_i_alt) || 0;

    const laan = ansk * (belPct / 100);
    const udbetaling = ansk - laan;

    const overskudFoerRenter = leje - omk;
    const renteUdgift = laan * (rentePct / 100);

    const cf = overskudFoerRenter - renteUdgift;
    const coc = udbetaling > 0 ? (cf / udbetaling) * 100 : null;

    return { laan, udbetaling, overskudFoerRenter, renteUdgift, cf, coc };
  }

  // fremtidig serie (leje + omk følger inflation, rente fast)
  function futureSeries(b: Building, belPct: number, inflationPct: number, rentePct: number, years: number) {
    const ansk = Number(b.anskaffelse) || 0;
    const leje0 = Number(b.lejeindtægter) || 0;
    const omk0 = Number(b.omkostninger_i_alt) || 0;

    const laan = ansk * (belPct / 100);
    const renteUdgift = laan * (rentePct / 100);

    const infl = (Number(inflationPct) || 0) / 100;

    return Array.from({ length: years }, (_, i) => {
      const year = i + 1;
      const factor = Math.pow(1 + infl, i); // år 1 = 1.0
      const leje = leje0 * factor;
      const omk = omk0 * factor;

      const overskudFoerRenter = leje - omk;
      const cf = overskudFoerRenter - renteUdgift;

      return { year, leje, omk, overskudFoerRenter, renteUdgift, cf };
    });
  }

  if (loading) return <p>Indlæser…</p>;

  return (
    <div className="advanced">
      <div className="advanced-header">
        <h2>Advanced</h2>
        <div className="advanced-tabs">
          <button className={tab === "stress" ? "active" : ""} onClick={() => setTab("stress")}>
            Stresstest
          </button>
          <button className={tab === "scenarios" ? "active" : ""} onClick={() => setTab("scenarios")}>
            Scenarier
          </button>
          <button className={tab === "future" ? "active" : ""} onClick={() => setTab("future")}>
            Fremtidigt cashflow
          </button>
        </div>
      </div>

      <div className="advanced-card">
        <div className="advanced-pick">
          <div className="advanced-pick-title">Ejendomme (fra Analyse-valg)</div>
          <div className="advanced-pick-list">
            {allBuildings
              .filter((b) => b.id)
              .map((b) => (
                <label key={b.id} className="advanced-check">
                  <input type="checkbox" checked={selectedIds.includes(b.id!)} onChange={() => toggleSelect(b.id!)} />
                  <span>{b.name}</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {selected.length === 0 && <p>Vælg mindst én ejendom.</p>}

      {/* STRESS */}
      {selected.length > 0 && tab === "stress" && (
        <div className="advanced-card">
          <div className="advanced-row">
            <div className="advanced-field">
              <label>Stress rente %</label>
              <input
                type="number"
                step="0.1"
                value={stressRente}
                onChange={(e) => setStressRente(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="advanced-field">
              <label>Stress belåning %</label>
              <select
                value={stressBelaaning === "fromAnalyse" ? "fromAnalyse" : String(stressBelaaning)}
                onChange={(e) => {
                  const v = e.target.value;
                  setStressBelaaning(v === "fromAnalyse" ? "fromAnalyse" : parseFloat(v) || 0);
                }}
              >
                <option value="fromAnalyse">Brug Analyse-belåning pr ejendom</option>
                {[60, 65, 70, 75, 80, 85].map((x) => (
                  <option key={x} value={x}>
                    {x}%
                  </option>
                ))}
              </select>
            </div>

            <button
              className="advanced-btn"
              onClick={() => {
                setFutureRente(Number(stressRente) || 0);
                setTab("future");
              }}
            >
              Fremtidigt cashflow
            </button>
          </div>

          <div className="advanced-table-wrap">
            <table className="advanced-table">
              <thead>
                <tr>
                  <th>Ejendom</th>
                  <th style={{ textAlign: "right" }}>CF (stress)</th>
                  <th style={{ textAlign: "right" }}>CoC (stress)</th>
                  <th style={{ textAlign: "right" }}>Rente</th>
                  <th style={{ textAlign: "right" }}>Belåning</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((b) => {
                  const id = b.id!;
                  const bel =
                    stressBelaaning === "fromAnalyse"
                      ? Math.round(getBelaaning(finans, id))
                      : (stressBelaaning as number);

                  const r = Number(stressRente) || 0;
                  const c = stressCalc(b, bel, r);

                  return (
                    <tr key={id}>
                      <td>{b.name}</td>
                      <td style={{ textAlign: "right" }} className={c.cf >= 0 ? "advanced-positive" : "advanced-negative"}>
                        {fmtKr(c.cf)}
                      </td>
                      <td style={{ textAlign: "right" }} className={(c.coc ?? 0) >= 0 ? "advanced-positive" : "advanced-negative"}>
                        {c.coc === null ? "—" : pct(c.coc)}
                      </td>
                      <td style={{ textAlign: "right" }}>{r.toFixed(1).replace(".", ",")} %</td>
                      <td style={{ textAlign: "right" }}>{bel} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="advanced-muted" style={{ marginTop: 10 }}>
            NB: Stresstest beregnes direkte (så 400% rente virker). “Scenarier”-tabben er stadig grid fra backend.
          </div>
        </div>
      )}

      {/* SCENARIOS */}
      {selected.length > 0 && tab === "scenarios" && (
        <div className="advanced-card">
          <details>
            <summary>Vis matrix pr ejendom (cash-on-cash)</summary>
            {selected.map((b) => {
              const s = scenariosMap[b.id!] ?? null;
              if (!s) return <div key={b.id} className="advanced-muted">Ingen data for {b.name}</div>;

              return (
                <div key={b.id} style={{ marginTop: 12, overflowX: "auto" }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "#e2e8f0" }}>{b.name}</div>
                  <table style={{ borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 6, background: "#2563eb", color: "#e2e8f0" }}>
                          Rente \\ Belåning
                        </th>
                        {s.belaaning_values.map((x) => (
                          <th key={x} style={{ textAlign: "right", padding: 6, background: "#2563eb", color: "#e2e8f0" }}>
                            {x}%
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rente_values.map((r, i) => (
                        <tr key={r}>
                          <td style={{ padding: 6, color: "#94a3b8", borderBottom: "1px solid #334155" }}>{r}%</td>
                          {s.cash_on_cash[i].map((v, j) => (
                            <td key={j} style={{ textAlign: "right", padding: 6, color: "#e2e8f0", borderBottom: "1px solid #334155" }}>
                              {Number.isFinite(v) ? v.toFixed(1).replace(".", ",") + " %" : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </details>

          <details style={{ marginTop: 12 }}>
            <summary>Debug: hvad grid vælger ved dine input</summary>
            {selected.map((b) => {
              const s = scenariosMap[b.id!] ?? null;
              if (!s) return null;
              const bel =
                stressBelaaning === "fromAnalyse"
                  ? Math.round(getBelaaning(finans, b.id!))
                  : (stressBelaaning as number);
              const v = atMatrix(s, stressRente, bel);
              return (
                <div key={b.id} className="advanced-muted" style={{ marginTop: 6 }}>
                  {b.name}: input {stressRente}% / {bel}% → grid {v?.usedRente ?? "?"}% / {v?.usedBel ?? "?"}%
                </div>
              );
            })}
          </details>
        </div>
      )}

      {/* FUTURE */}
      {selected.length > 0 && tab === "future" && (
        <div className="advanced-card">
          <div className="advanced-row">
            <div className="advanced-field">
              <label>Inflation %</label>
              <input
                type="number"
                step="0.1"
                value={futureInflation}
                onChange={(e) => setFutureInflation(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="advanced-field">
              <label>Rente %</label>
              <input
                type="number"
                step="0.1"
                value={futureRente}
                onChange={(e) => setFutureRente(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="advanced-field">
              <label>År</label>
              <input
                type="number"
                step="1"
                value={futureYears}
                onChange={(e) => setFutureYears(Math.max(1, Math.min(60, parseInt(e.target.value) || 30)))}
              />
            </div>

            <button className="advanced-btn" onClick={() => setTab("stress")}>
              Tilbage
            </button>
          </div>

          {selected.map((b) => {
            const id = b.id!;
            const bel =
              stressBelaaning === "fromAnalyse"
                ? Math.round(getBelaaning(finans, id))
                : (stressBelaaning as number);

            const series = futureSeries(b, bel, futureInflation, futureRente, futureYears);

            return (
              <div key={id} style={{ marginTop: 14, overflowX: "auto" }}>
                <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                  {b.name} (belåning {bel}%)
                </div>

                <table className="advanced-table">
                  <thead>
                    <tr>
                      <th>År</th>
                      <th style={{ textAlign: "right" }}>Leje</th>
                      <th style={{ textAlign: "right" }}>Omkostninger</th>
                      <th style={{ textAlign: "right" }}>Overskud før renter</th>
                      <th style={{ textAlign: "right" }}>Renteudgift</th>
                      <th style={{ textAlign: "right" }}>Cashflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((r) => (
                      <tr key={r.year}>
                        <td>{r.year}</td>
                        <td style={{ textAlign: "right" }}>{fmtKr(r.leje)}</td>
                        <td style={{ textAlign: "right" }}>{fmtKr(r.omk)}</td>
                        <td style={{ textAlign: "right" }}>{fmtKr(r.overskudFoerRenter)}</td>
                        <td style={{ textAlign: "right" }}>{fmtKr(r.renteUdgift)}</td>
                        <td style={{ textAlign: "right" }} className={r.cf >= 0 ? "advanced-positive" : "advanced-negative"}>
                          {fmtKr(r.cf)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}