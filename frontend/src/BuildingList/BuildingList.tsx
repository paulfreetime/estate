import { useEffect, useState, useRef } from "react";
import "./BuildingList.css";

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

const summaryColumns: { key: keyof Building | "overskud"; label: string }[] = [
  { key: "name", label: "Navn" },
  { key: "address", label: "Adresse" },
  { key: "total_kvm", label: "Kvm" },
  { key: "antal_lejemaal", label: "Lejemål" },
  { key: "anskaffelse", label: "Anskaffelse" },
  { key: "lejeindtægter", label: "Lejeindtægter" },
  { key: "omkostninger_i_alt", label: "Omk. i alt" },
  { key: "overskud", label: "Overskud" },
];

const detailFields: {
  key: keyof Building;
  label: string;
  type: "text" | "number";
}[] = [
  { key: "name", label: "Navn", type: "text" },
  { key: "address", label: "Adresse", type: "text" },
  { key: "total_kvm", label: "Total kvm", type: "number" },
  { key: "antal_lejemaal", label: "Antal lejemål", type: "number" },
  { key: "anskaffelse", label: "Anskaffelse", type: "number" },
  { key: "lejeindtægter", label: "Lejeindtægter", type: "number" },
  { key: "lokaleomkostninger", label: "Lokaleomkostninger", type: "number" },
  { key: "fjernvarme", label: "Fjernvarme", type: "number" },
  { key: "forsikring", label: "Forsikring", type: "number" },
  { key: "ejendomsskat", label: "Ejendomsskat", type: "number" },
  { key: "renovation", label: "Renovation", type: "number" },
  { key: "vand", label: "Vand", type: "number" },
  { key: "småting", label: "Småting", type: "number" },
  { key: "internet", label: "Internet", type: "number" },
  { key: "ejerforening", label: "Ejerforening", type: "number" },
  { key: "administration", label: "Administration", type: "number" },
  { key: "regnskabsassistance", label: "Regnskabsassistance", type: "number" },
  { key: "vicevært", label: "Vicevært", type: "number" },
  {
    key: "udvendig_vedligeholdelse",
    label: "Udvendig vedligeholdelse",
    type: "number",
  },
  { key: "andet", label: "Andet", type: "number" },
  { key: "kommentar", label: "Kommentar", type: "text" },
];

const omkostningKeys: (keyof Building)[] = [
  "lokaleomkostninger",
  "fjernvarme",
  "forsikring",
  "ejendomsskat",
  "renovation",
  "vand",
  "småting",
  "internet",
  "ejerforening",
  "administration",
  "regnskabsassistance",
  "vicevært",
  "udvendig_vedligeholdelse",
  "andet",
];

function fmt(val: number) {
  return (val || 0).toLocaleString("da-DK") + " kr";
}

function overskud(b: Building) {
  return b.lejeindtægter - b.omkostninger_i_alt;
}

function BuildingList() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Building | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Building | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<any>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected?.id) {
      fetch(`http://localhost:5000/api/buildings/${selected.id}/scenarios`)
        .then((res) => res.json())
        .then(setScenarios)
        .catch(() => setScenarios(null));
    } else {
      setScenarios(null);
    }
  }, [selected]);

  useEffect(() => {
    fetch("http://localhost:5000/api/buildings")
      .then((res) => res.json())
      .then((data) => setBuildings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected?.id) {
      fetch(`http://localhost:5000/api/buildings/${selected.id}/files`)
        .then((res) => res.json())
        .then((data) => setFiles(data.files))
        .catch(() => setFiles([]));
    } else {
      setFiles([]);
    }
  }, [selected]);

  function startEdit() {
    if (selected) {
      setEditData({ ...selected });
      setEditing(true);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setEditData(null);
  }

  function handleEditChange(key: keyof Building, value: string, type: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      [key]: type === "number" ? parseFloat(value) || 0 : value,
    });
  }

  async function handleSaveEdit() {
    if (!editData?.id) return;

    const updated = {
      ...editData,
      omkostninger_i_alt: omkostningKeys.reduce(
        (sum, key) => sum + (Number(editData[key]) || 0),
        0,
      ),
    };

    try {
      const res = await fetch(
        `http://localhost:5000/api/buildings/${updated.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        },
      );
      if (res.ok) {
        const result = await res.json();
        setBuildings((prev) =>
          prev.map((b) => (b.id === result.id ? result : b)),
        );
        setSelected(result);
        setEditing(false);
        setEditData(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected?.id || !e.target.files?.length) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch(
        `http://localhost:5000/api/buildings/${selected.id}/files`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFiles((prev) => [...prev, ...data.files]);
      }
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  }

  async function handleDeleteFile(filename: string) {
    if (!selected?.id || !confirm(`Slet ${filename}?`)) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/buildings/${selected.id}/files/${filename}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f !== filename));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(b: Building) {
    if (!confirm(`Slet ${b.name}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/buildings/${b.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBuildings((prev) => prev.filter((x) => x.id !== b.id));
        setSelected(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setEditData(null);
  }

  if (loading) return <p className="building-list-msg">Indlæser…</p>;
  if (buildings.length === 0)
    return <p className="building-list-msg">Ingen ejendomme endnu.</p>;

  return (
    <div className="building-list">
      <h2>Ejendomme</h2>
      <div className="building-list-table-wrap">
        <table className="building-list-table">
          <thead>
            <tr>
              {summaryColumns.map((col) => (
                <th className="building-list-header" key={col.key}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buildings.map((b, i) => (
              <tr
                key={b.id ?? i}
                className={`building-list-row ${selected?.id === b.id ? "active" : ""}`}
                onClick={() => {
                  setSelected(selected?.id === b.id ? null : b);
                  setEditing(false);
                  setEditData(null);
                }}
              >
                {summaryColumns.map((col) => {
                  if (col.key === "overskud") {
                    const val = overskud(b);
                    return (
                      <td
                        className="building-list-cell"
                        key={col.key}
                        style={{ color: val >= 0 ? "#4ade80" : "#f87171" }}
                      >
                        {fmt(val)}
                      </td>
                    );
                  }
                  const raw = b[col.key as keyof Building];
                  return (
                    <td className="building-list-cell" key={col.key}>
                      {typeof raw === "number" ? fmt(raw) : raw}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="building-modal-overlay" onClick={closeModal}>
          <div className="building-modal" onClick={(e) => e.stopPropagation()}>
            <button className="building-modal-close" onClick={closeModal}>
              ×
            </button>

            {!editing ? (
              <>
                <h3 className="building-modal-title">{selected.name}</h3>
                <p className="building-modal-address">{selected.address}</p>
                <div>
                  {detailFields
                    .filter((f) => f.key !== "name" && f.key !== "address")
                    .map((f) => (
                      <div key={f.key} className="building-detail-row">
                        <span className="building-detail-label">{f.label}</span>
                        <span className="building-detail-value">
                          {f.key === "antal_lejemaal"
                            ? selected[f.key]
                            : fmt(selected[f.key] as number)}
                        </span>
                      </div>
                    ))}
                  <div className="building-detail-row building-detail-overskud">
                    <span className="building-detail-label">
                      Omkostninger i alt
                    </span>
                    <span className="building-detail-value">
                      {fmt(selected.omkostninger_i_alt)}
                    </span>
                  </div>
                  <div className="building-detail-row building-detail-overskud">
                    <span className="building-detail-label">Overskud</span>
                    <span
                      className="building-detail-value"
                      style={{
                        color: overskud(selected) >= 0 ? "#4ade80" : "#f87171",
                      }}
                    >
                      {fmt(overskud(selected))}
                    </span>
                  </div>
                </div>
                {scenarios && (
                  <div style={{ marginTop: 16 }}>
                    <h4>Cash-on-cash (rente x belåning)</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{ borderCollapse: "collapse", minWidth: 600 }}
                      >
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: 6 }}>
                              Rente \\ Belåning
                            </th>
                            {scenarios.belaaning_values.map((b: number) => (
                              <th
                                key={b}
                                style={{ textAlign: "right", padding: 6 }}
                              >
                                {b}%
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios.rente_values.map(
                            (r: number, i: number) => (
                              <tr key={r}>
                                <td style={{ padding: 6 }}>{r}%</td>
                                {scenarios.cash_on_cash[i].map(
                                  (v: number, j: number) => (
                                    <td
                                      key={j}
                                      style={{ textAlign: "right", padding: 6 }}
                                    >
                                      {Number.isFinite(v)
                                        ? v.toFixed(1).replace(".", ",") + " %"
                                        : "—"}
                                    </td>
                                  ),
                                )}
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button className="building-edit-btn" onClick={startEdit}>
                  Rediger
                </button>
              </>
            ) : (
              <>
                <h3 className="building-modal-title">Rediger ejendom</h3>
                <div className="building-edit-form">
                  {detailFields.map((f) => (
                    <div key={f.key} className="building-edit-row">
                      <label className="building-edit-label">{f.label}</label>
                      <input
                        className="building-edit-input"
                        type={f.type}
                        value={editData?.[f.key] ?? ""}
                        onChange={(e) =>
                          handleEditChange(f.key, e.target.value, f.type)
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="building-edit-actions">
                  <button
                    className="building-save-btn"
                    onClick={handleSaveEdit}
                  >
                    Gem
                  </button>
                  <button className="building-cancel-btn" onClick={cancelEdit}>
                    Annuller
                  </button>
                </div>
              </>
            )}

            <div className="building-files-section">
              <h4 className="building-files-title">Dokumenter</h4>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                onChange={handleUpload}
              />
              <button
                className="building-upload-btn"
                onClick={() => fileInput.current?.click()}
              >
                Upload filer
              </button>
              {files.length === 0 && (
                <p className="building-files-empty">Ingen dokumenter endnu.</p>
              )}
              {files.map((f) => (
                <div key={f} className="building-file-row">
                  <a
                    className="building-file-link"
                    href={`http://localhost:5000/api/buildings/${selected.id}/files/${f}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f}
                  </a>
                  <button
                    className="building-file-delete"
                    onClick={() => handleDeleteFile(f)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              className="building-delete-btn"
              onClick={() => handleDelete(selected)}
            >
              Slet ejendom
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingList;
