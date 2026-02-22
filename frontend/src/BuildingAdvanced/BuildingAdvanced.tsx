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

function getRente(f: FinansSettings, id: number): number {
  return f.overrides[id]?.rente ?? f.globalRente;
}

function getBelaaning(f: FinansSettings, id: number): number {
  return f.overrides[id]?.belaaning ?? f.globalBelaaning;
}

function fmtKr(val: number) {
  return (val || 0).toLocaleString("da-DK") + " kr";
}

function pct(val: number) {
  return (val || 0).toFixed(2).replace(".", ",") + " %";
}

type Scenarios = {
  rente_values: number[];
  belaaning_values: number[];
  cash_flow: number[][];
  cash_on_cash: number[][];
  overskud_foer_renter: number;
};

function atMatrix(s: Scenarios | null, rente: number, bel: number) {
  if (!s) return null;
  const ri = s.rente_values?.findIndex((x) => x === rente);
  const bi = s.belaaning_values?.findIndex((x) => x === bel);
  if (ri === -1 || bi === -1) return null;
  return { cf: s.cash_flow?.[ri]?.[bi], coc: s.cash_on_cash?.[ri]?.[bi] };
}

export default function BuildingAdvanced() {
  const [tab, setTab] = useState<"stress" | "scenarios">("stress");
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(getSavedIds);
  const [finans] = useState<FinansSettings>(loadFinans);
  const [scenariosMap, setScenariosMap] = useState<Record<number, Scenarios | null>>({});
  const [loading, setLoading] = useState(true);

  // stress settings
  const [stressRente, setStressRente] = useState(6);
  const [stressBelaaning, setStressBelaaning] = useState<number | "fromAnalyse">("fromAnalyse");

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
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id!)}
                    onChange={() => toggleSelect(b.id!)}
                  />
                  <span>{b.name}</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {selected.length === 0 && <p>Vælg mindst én ejendom.</p>}

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
                  const s = scenariosMap[id] ?? null;
                  const bel =
                    stressBelaaning === "fromAnalyse"
                      ? Math.round(getBelaaning(finans, id))
                      : stressBelaaning;

                  const v = atMatrix(s, stressRente, bel);
                  const cf = v?.cf;
                  const coc = v?.coc;

                  return (
                    <tr key={id}>
                      <td>{b.name}</td>
                      <td style={{ textAlign: "right" }}>
                        {Number.isFinite(cf as number) ? fmtKr(cf as number) : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {Number.isFinite(coc as number) ? pct(coc as number) : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>{stressRente.toFixed(1).replace(".", ",")} %</td>
                      <td style={{ textAlign: "right" }}>{bel} %</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.length > 0 && tab === "scenarios" && (
        <div className="advanced-card">
          <p style={{ marginTop: 0 }}>
            Klik en ejendom for at se dens matrix (cash-on-cash).
          </p>

          <details>
            <summary>Vis matrix pr ejendom</summary>
            {selected.map((b) => {
              const s = scenariosMap[b.id!] ?? null;
              if (!s) return <div key={b.id}>Ingen data for {b.name}</div>;

              return (
                <div key={b.id} style={{ marginTop: 12, overflowX: "auto" }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{b.name}</div>
                  <table style={{ borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 6 }}>Rente \\ Belåning</th>
                        {s.belaaning_values.map((x) => (
                          <th key={x} style={{ textAlign: "right", padding: 6 }}>
                            {x}%
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rente_values.map((r, i) => (
                        <tr key={r}>
                          <td style={{ padding: 6 }}>{r}%</td>
                          {s.cash_on_cash[i].map((v, j) => (
                            <td key={j} style={{ textAlign: "right", padding: 6 }}>
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
        </div>
      )}
    </div>
  );
}