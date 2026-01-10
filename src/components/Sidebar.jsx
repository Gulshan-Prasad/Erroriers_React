import "./Sidebar.css";

export default function Sidebar({ activeTab, onChange }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "report", label: "Report Waterlogging" },
    { id: "history", label: "History" },
  ];

  return (
    <aside className="sidebar">
      <h2 className="sidebarTitle">Tabs</h2>

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
