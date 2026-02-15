import { useState } from "react";
import "./BuildingForm.css";

function BuildingForm() {
  const fields = [
    { label: "Navn", type: "text" },
    { label: "Adresse", type: "text" },
    { label: "Total kvm", type: "number" },
    { label: "Antal lejemål", type: "number" },
    { label: "Anskaffelse", type: "number" },
    { label: "Lejeindtægter", type: "number" },
    { label: "Lokaleomkostninger", type: "number" },
    { label: "Fjernvarme", type: "number" },
    { label: "Forsikring", type: "number" },
    { label: "Ejendomsskat", type: "number" },
    { label: "Renovation", type: "number" },
    { label: "Vand", type: "number" },
    { label: "Småting", type: "number" },
    { label: "Internet", type: "number" },
    { label: "Ejerforening", type: "number" },
    { label: "Administration", type: "number" },
    { label: "Regnskabsassistance", type: "number" },
    { label: "Vicevært", type: "number" },
    { label: "Udvendig vedligeholdelse", type: "number" },
    { label: "Andet", type: "number" },
    { label: "Kommentar", type: "text" },
  ];

  const [values, setValues] = useState<Record<string, string | number>>({});
  const [saved, setSaved] = useState(false);

  function toName(label: string) {
    const converted = label.toLowerCase().replaceAll(" ", "_");
    if (converted === "navn") return "name";
    if (converted === "adresse") return "address";
    if (converted === "antal_lejemål") return "antal_lejemaal";
    return converted;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;
    if (type === "number" && value !== "") {
      finalValue = parseFloat(value) || 0;
    }
    setValues(prev => ({ ...prev, [name]: finalValue }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: Record<string, any> = {};
    fields.forEach(field => {
      const fieldName = toName(field.label);
      const value = values[fieldName];
      if (field.type === "number") {
        payload[fieldName] = value || 0;
      } else {
        payload[fieldName] = value || "";
      }
    });

    const omkostningKeys = [
      "lokaleomkostninger", "fjernvarme", "forsikring", "ejendomsskat",
      "renovation", "vand", "småting", "internet", "ejerforening",
      "administration", "regnskabsassistance", "vicevært",
      "udvendig_vedligeholdelse", "andet"
    ];
    payload.omkostninger_i_alt = omkostningKeys.reduce((sum, key) => sum + (Number(payload[key]) || 0), 0);

    try {
      const res = await fetch("http://localhost:5000/api/buildings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setValues({});
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h2>Ny ejendom</h2>

      {fields.map(({ label, type }) => {
        const nameAttr = toName(label);
        return (
          <div key={label} className="form-row">
            <label>{label}</label>
            <input
              type={type}
              name={nameAttr}
              value={values[nameAttr] || ""}
              onChange={handleChange}
            />
          </div>
        );
      })}

      <button type="submit">Gem</button>
      {saved && <p style={{ color: "green", marginTop: "8px" }}>Ejendom gemt!</p>}
    </form>
  );
}

export default BuildingForm;