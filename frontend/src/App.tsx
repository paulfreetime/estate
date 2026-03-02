import { useState, useEffect } from "react";
import BuildingForm from "./BuildingForm/BuildingForm";
import Home from "./Home/Home";
import BuildingList from "./BuildingList/BuildingList";
import BuildingAnalyse from "./BuildingAnalyse/BuildingAnalyse";
import BuildingAdvanced from "./BuildingAdvanced/BuildingAdvanced";
import Login from "./Login";

function getView() {
  const hash = window.location.hash.replace("#", "");
  return ["home", "form", "list", "analyse", "advanced"].includes(hash)
    ? hash
    : "home";
}

function App() {
  const [view, setView] = useState(getView);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    function onHashChange() {
      setView(getView());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(v: string) {
    window.location.hash = v;
  }

  function logout() {
    localStorage.removeItem("token");
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <>
      <header
        style={{
          backgroundColor: "#1e3a8a",
          color: "white",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "40px",
          justifyContent: "flex-start",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Ejendomsoversigt</h1>
        <nav style={{ display: "flex", gap: "8px", flex: 1 }}>
          <button onClick={() => navigate("home")}>Forside</button>
          <button onClick={() => navigate("form")}>Indtast ny ejendom</button>
          <button onClick={() => navigate("list")}>Se ejendomme</button>
          <button onClick={() => navigate("analyse")}>Analyse</button>
          <button onClick={() => navigate("advanced")}>Advanced</button>
        </nav>
        <button
          onClick={logout}
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            padding: "6px 14px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Log ud
        </button>
      </header>

      <main
        style={{
          padding: "24px",
          background: "transparent",
          boxShadow: "none",
          border: "none",
        }}
      >
        {view === "home" && <Home onNavigate={navigate} />}
        {view === "form" && <BuildingForm />}
        {view === "list" && <BuildingList />}
        {view === "analyse" && <BuildingAnalyse />}
        {view === "advanced" && <BuildingAdvanced />}
      </main>
    </>
  );
}

export default App;
