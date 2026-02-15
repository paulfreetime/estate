import "./Home.css";

interface HomeProps {
  onNavigate: (view: string) => void;
}

function Home({ onNavigate }: HomeProps) {
  return (
    <div className="home-container">
      <h1>Ejendomsoversigt</h1>
      <p>Administrér og følg dine investeringsejendomme samlet ét sted.</p>

      <div className="home-buttons">
        <button onClick={() => onNavigate("form")}>
          Indtast ny ejendom
        </button>
        <button onClick={() => onNavigate("list")}>
          Se ejendomme
        </button>
      </div>
    </div>
  );
}

export default Home;
