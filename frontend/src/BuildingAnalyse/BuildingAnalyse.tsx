import { useEffect, useState } from "react";
import "./BuildingAnalyse.css";

interface Building {
  id?: number;
  name: string;
  address: string;
  total_kvm: number;
  antal_lejemaal: number;
  anskaffelse: number;
  lejeindtægter: number;
  lokaleomkostninger: number;
  fjernvarme: number;
  forsikring: number;
  ejendomsskat: number;
  renovation: number;
  vand: number;
  småting: number;
  internet: number;
  ejerforening: number;
  administration: number;
  regnskabsassistance: number;
  vicevært: number;
  udvendig_vedligeholdelse: number;
  andet: number;
  omkostninger_i_alt: number;
  kommentar: string;
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

function saveFinans(f: FinansSettings) {
  localStorage.setItem("analyse-finans", JSON.stringify(f));
}

function getRente(f: FinansSettings, id: number): number {
  return f.overrides[id]?.rente ?? f.globalRente;
}

function getBelaaning(f: FinansSettings, id: number): number {
  return f.overrides[id]?.belaaning ?? f.globalBelaaning;
}

type RowKey = keyof Building | "overskud" | "afkast" | "bruttoafkast" | "leje_pr_kvm" | "omk_pr_kvm" | "leje_pr_lejemaal" | "omkostningsprocent" | "belaaning_pct" | "rente_pct" | "udbetaling" | "laanebeloeb" | "aarlig_rente" | "cash_flow" | "cash_on_cash" | "sep1" | "sep2" | "sep3" | "sep4" | "sep5" | "sep6";

const rows: { key: RowKey; label: string; separator?: boolean }[] = [
  { key: "total_kvm", label: "Total kvm" },
  { key: "antal_lejemaal", label: "Antal lejemål" },
  { key: "anskaffelse", label: "Anskaffelse" },
  { key: "sep1", label: "", separator: true },
  { key: "lejeindtægter", label: "Lejeindtægter" },
  { key: "sep2", label: "", separator: true },
  { key: "lokaleomkostninger", label: "Lokaleomkostninger" },
  { key: "fjernvarme", label: "Fjernvarme" },
  { key: "forsikring", label: "Forsikring" },
  { key: "ejendomsskat", label: "Ejendomsskat" },
  { key: "renovation", label: "Renovation" },
  { key: "vand", label: "Vand" },
  { key: "småting", label: "Småting" },
  { key: "internet", label: "Internet" },
  { key: "ejerforening", label: "Ejerforening" },
  { key: "administration", label: "Administration" },
  { key: "regnskabsassistance", label: "Regnskabsassistance" },
  { key: "vicevært", label: "Vicevært" },
  { key: "udvendig_vedligeholdelse", label: "Udvendig vedligeholdelse" },
  { key: "andet", label: "Andet" },
  { key: "omkostninger_i_alt", label: "Omkostninger i alt" },
  { key: "sep3", label: "", separator: true },
  { key: "overskud", label: "Overskud før renter" },
  { key: "sep4", label: "", separator: true },
  { key: "aarlig_rente", label: "Årlig renteudgift" },
  { key: "sep5", label: "", separator: true },
  { key: "cash_flow", label: "Overskud efter renter" },
  { key: "sep6", label: "", separator: true },
  { key: "cash_on_cash", label: "Cash-on-cash return" },
  { key: "afkast", label: "Nettoafkast %" },
  { key: "bruttoafkast", label: "Bruttoafkast %" },
  { key: "omkostningsprocent", label: "Omkostningsprocent" },
  { key: "leje_pr_kvm", label: "Leje pr. m²" },
  { key: "omk_pr_kvm", label: "Omkostninger pr. m²" },
  { key: "leje_pr_lejemaal", label: "Leje pr. lejemål" },
  { key: "udbetaling", label: "Udbetaling" },
  { key: "laanebeloeb", label: "Lånebeløb" },
  { key: "belaaning_pct", label: "Belåning %" },
  { key: "rente_pct", label: "Rente % (ÅOP)" },
  { key: "kommentar", label: "Kommentar" },
];

function fmt(val: number) {
  return (val || 0).toLocaleString("da-DK") + " kr";
}

function pct(val: number) {
  return (val || 0).toFixed(2).replace(".", ",") + " %";
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

function saveIds(ids: number[]) {
  localStorage.setItem("analyse-ids", JSON.stringify(ids));
}

function BuildingAnalyse() {
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(getSavedIds);
  const [loading, setLoading] = useState(true);
  const [filesMap, setFilesMap] = useState<Record<number, string[]>>({});
  const [finans, setFinans] = useState<FinansSettings>(loadFinans);

  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then((res) => res.json())
      .then((data) => setAllBuildings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    selectedIds.forEach((id) => {
      if (filesMap[id] === undefined) {
        fetch(`http://localhost:5000/api/buildings/${id}/files`)
          .then((res) => res.json())
          .then((data) => setFilesMap((prev) => ({ ...prev, [id]: data.files })))
          .catch(() => setFilesMap((prev) => ({ ...prev, [id]: [] })));
      }
    });
  }, [selectedIds]);

  function updateFinans(updated: FinansSettings) {
    setFinans(updated);
    saveFinans(updated);
  }

  function setGlobalRente(val: number) {
    updateFinans({ ...finans, globalRente: val });
  }

  function setGlobalBelaaning(val: number) {
    updateFinans({ ...finans, globalBelaaning: val });
  }

  function setOverride(id: number, field: "rente" | "belaaning", val: number | undefined) {
    const overrides = { ...finans.overrides };
    if (!overrides[id]) overrides[id] = {};
    if (val === undefined) {
      delete overrides[id][field];
      if (Object.keys(overrides[id]).length === 0) delete overrides[id];
    } else {
      overrides[id][field] = val;
    }
    updateFinans({ ...finans, overrides });
  }

  function addBuilding(id: number) {
    if (!selectedIds.includes(id)) {
      const next = [...selectedIds, id];
      setSelectedIds(next);
      saveIds(next);
    }
  }

  function removeBuilding(id: number) {
    const next = selectedIds.filter((x) => x !== id);
    setSelectedIds(next);
    saveIds(next);
  }

async function exportExcel() {
    const data: Record<string, string>[] = [];

    rows.forEach((row) => {
      if (row.separator) return;
      const rowData: Record<string, string> = { "": row.label };
      selected.forEach((b) => {
        if (row.key === "rente_pct") {
          rowData[b.name] = getRente(finans, b.id!) + " %";
        } else if (row.key === "belaaning_pct") {
          rowData[b.name] = getBelaaning(finans, b.id!) + " %";
        } else {
          rowData[b.name] = getValue(b, row.key);
        }
      });
      data.push(rowData);
    });

    // Tilføj kommentar
    const kommentarRow: Record<string, string> = { "": "Kommentar" };
    selected.forEach((b) => {
      kommentarRow[b.name] = (b as any).kommentar || "";
    });
    data.push(kommentarRow);

    // Tilføj dokumenter
    const dokRow: Record<string, string> = { "": "Dokumenter" };
    selected.forEach((b) => {
      dokRow[b.name] = (filesMap[b.id!] || []).join(", ");
    });
    data.push(dokRow);

    const res = await fetch("http://localhost:5000/api/export-analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analyse.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function calc(b: Building) {
    const id = b.id!;
    const rente = getRente(finans, id);
    const belaaning = getBelaaning(finans, id);
    const laan = (b.anskaffelse || 0) * (belaaning / 100);
    const udbetaling = (b.anskaffelse || 0) - laan;
    const aarligRente = laan * (rente / 100);
    const overskud = (b.lejeindtægter || 0) - (b.omkostninger_i_alt || 0);
    const cashFlow = overskud - aarligRente;
    const cashOnCash = udbetaling > 0 ? (cashFlow / udbetaling) * 100 : 0;
    return { rente, belaaning, laan, udbetaling, aarligRente, overskud, cashFlow, cashOnCash };
  }

  function getValue(b: Building, key: string): string {
    const c = calc(b);

    if (key === "overskud") return fmt(c.overskud);
    if (key === "belaaning_pct") return "input";
    if (key === "rente_pct") return "input";
    if (key === "udbetaling") return fmt(c.udbetaling);
    if (key === "laanebeloeb") return fmt(c.laan);
    if (key === "aarlig_rente") return fmt(c.aarligRente);
    if (key === "cash_flow") return fmt(c.cashFlow);
    if (key === "cash_on_cash") {
      if (c.udbetaling <= 0) return "—";
      return pct(c.cashOnCash);
    }
    if (key === "afkast") {
      if (!b.anskaffelse) return "—";
      return pct((c.overskud / b.anskaffelse) * 100);
    }
    if (key === "bruttoafkast") {
      if (!b.anskaffelse) return "—";
      return pct(((b.lejeindtægter || 0) / b.anskaffelse) * 100);
    }
    if (key === "omkostningsprocent") {
      if (!b.lejeindtægter) return "—";
      return pct(((b.omkostninger_i_alt || 0) / b.lejeindtægter) * 100);
    }
    if (key === "leje_pr_kvm") {
      if (!b.total_kvm) return "—";
      return fmt(Math.round((b.lejeindtægter || 0) / b.total_kvm));
    }
    if (key === "omk_pr_kvm") {
      if (!b.total_kvm) return "—";
      return fmt(Math.round((b.omkostninger_i_alt || 0) / b.total_kvm));
    }
    if (key === "leje_pr_lejemaal") {
      if (!b.antal_lejemaal) return "—";
      return fmt(Math.round((b.lejeindtægter || 0) / b.antal_lejemaal));
    }
    if (key === "antal_lejemaal") return String(b.antal_lejemaal || 0);
    if (key === "total_kvm") return (b.total_kvm || 0).toLocaleString("da-DK") + " m²";
    if (key === "kommentar") return b.kommentar || "";

    const raw = b[key as keyof Building];
    if (typeof raw === "number") return fmt(raw);
    if (raw === undefined || raw === null) return "0 kr";
    return String(raw);

  }

function getValueClass(b: Building, key: string): string {
    const c = calc(b);

    if (key === "overskud" || key === "afkast") {
      return c.overskud >= 0 ? "analyse-positive" : "analyse-negative";
    }
    if (key === "cash_flow" || key === "cash_on_cash") {
      return c.cashFlow >= 0 ? "analyse-positive" : "analyse-negative";
    }
    if (key === "omkostningsprocent") {
      if (!b.lejeindtægter) return "";
      const val = ((b.omkostninger_i_alt || 0) / b.lejeindtægter) * 100;
      return val <= 50 ? "analyse-positive" : "analyse-negative";
    }
    if (key === "bruttoafkast" || key === "leje_pr_kvm" || key === "omk_pr_kvm" || key === "leje_pr_lejemaal") {
      return "analyse-kpi";
    }
    return "";
  }

  const selected = allBuildings.filter((b) => b.id !== undefined && selectedIds.includes(b.id));
  const available = allBuildings.filter((b) => b.id !== undefined && !selectedIds.includes(b.id!));

  if (loading) return <p className="analyse-msg">Indlæser…</p>;

  return (
    <div className="analyse">
      <h2>Analyse</h2>

    <div className="analyse-controls">
        <div className="analyse-control">
          <label>Global rente % (ÅOP)</label>
          <input
            className="analyse-control-input"
            type="number"
            step="0.01"
            value={finans.globalRente}
            onChange={(e) => setGlobalRente(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="analyse-control">
          <label>Global belåning %</label>
          <input
            className="analyse-control-input"
            type="number"
            step="1"
            value={finans.globalBelaaning}
            onChange={(e) => setGlobalBelaaning(parseFloat(e.target.value) || 0)}
          />
        </div>
        {selected.length > 0 && (
          <button className="analyse-export-btn" onClick={exportExcel}>
            Eksporter til Excel
          </button>
        )}
      </div>

      <div className="analyse-selector"></div>


      <div className="analyse-selector">
        <select
          className="analyse-dropdown"
          value=""
          onChange={(e) => addBuilding(Number(e.target.value))}
        >
          <option value="" disabled>Tilføj ejendom…</option>
          {available.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {selected.length === 0 && <p className="analyse-msg">Vælg ejendomme ovenfor for at sammenligne.</p>}

      {selected.length > 0 && (
        <div className="analyse-table-wrap">
          <table className="analyse-table">
            <thead>
              <tr>
                <th className="analyse-header analyse-label-col"></th>
                {selected.map((b) => (
                  <th className="analyse-header" key={b.id}>
                    <div className="analyse-header-content">
                      <span>{b.name}</span>
                      <button
                        className="analyse-remove"
                        onClick={() => removeBuilding(b.id!)}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row.separator) {
                  return (
                    <tr key={row.key} className="analyse-separator-row">
                      <td colSpan={selected.length + 1}></td>
                    </tr>
                  );
                }

                if (row.key === "rente_pct") {
                  return (
                    <tr key={row.key}>
                      <td className="analyse-label">{row.label}</td>
                      {selected.map((b) => {
                        const hasOverride = finans.overrides[b.id!]?.rente !== undefined;
                        return (
                          <td key={b.id} className="analyse-value">
                            <input
                              className={`analyse-inline-input ${hasOverride ? "analyse-override" : ""}`}
                              type="number"
                              step="0.01"
                              value={getRente(finans, b.id!)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val === finans.globalRente) {
                                  setOverride(b.id!, "rente", undefined);
                                } else {
                                  setOverride(b.id!, "rente", val);
                                }
                              }}
                            />
                            {hasOverride && (
                              <button
                                className="analyse-reset-btn"
                                onClick={() => setOverride(b.id!, "rente", undefined)}
                              >
                                ↩
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                if (row.key === "belaaning_pct") {
                  return (
                    <tr key={row.key}>
                      <td className="analyse-label">{row.label}</td>
                      {selected.map((b) => {
                        const hasOverride = finans.overrides[b.id!]?.belaaning !== undefined;
                        return (
                          <td key={b.id} className="analyse-value">
                            <input
                              className={`analyse-inline-input ${hasOverride ? "analyse-override" : ""}`}
                              type="number"
                              step="1"
                              value={getBelaaning(finans, b.id!)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val === finans.globalBelaaning) {
                                  setOverride(b.id!, "belaaning", undefined);
                                } else {
                                  setOverride(b.id!, "belaaning", val);
                                }
                              }}
                            />
                            {hasOverride && (
                              <button
                                className="analyse-reset-btn"
                                onClick={() => setOverride(b.id!, "belaaning", undefined)}
                              >
                                ↩
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                return (
                  <tr
                    key={row.key}
                    className={
                      row.key === "omkostninger_i_alt" || row.key === "overskud" || row.key === "cash_flow"
                        ? "analyse-highlight-row"
                        : ""
                    }
                  >
                    <td className="analyse-label">{row.label}</td>
                    {selected.map((b) => (
                      <td
                        key={b.id}
                        className={`analyse-value ${getValueClass(b, row.key)}`}
                      >
                        {getValue(b, row.key)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="analyse-separator-row">
                <td colSpan={selected.length + 1}></td>
              </tr>
              <tr>
                <td className="analyse-label">Dokumenter</td>
                {selected.map((b) => (
                  <td key={b.id} className="analyse-files-cell">
                    {(filesMap[b.id!] || []).length === 0 && (
                      <span className="analyse-no-files">Ingen filer</span>
                    )}
                    {(filesMap[b.id!] || []).map((f) => (
                      <a
                        key={f}
                        className="analyse-file-link"
                        href={`http://localhost:5000/api/buildings/${b.id}/files/${f}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {f}
                      </a>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BuildingAnalyse;