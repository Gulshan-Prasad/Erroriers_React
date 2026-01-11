import "./Sidebar.css";

export default function Sidebar({ activeTab, onChange }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "report", label: "Report Waterlogging" },
    { id: "history", label: "Weather" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <img src="/src/assets/logo.png" alt="Jal Drishti logo" />
        <div>
          <div className="brandTitle">Jal Drishti</div>
          <div className="brandSub">Water Intelligence</div>
        </div>
      </div>

<hr className="divider"></hr>

      <div className="sidebarTabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`sidebarBtn ${activeTab === t.id ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
