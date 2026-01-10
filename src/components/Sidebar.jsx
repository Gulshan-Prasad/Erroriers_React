export default function Sidebar({ activeTab, onChange }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "report", label: "Report Waterlogging" },
    { id: "history", label: "History" },
  ];

  return (
    <aside className="w-64 border-r bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">Tabs</h2>

      <div className="space-y-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              activeTab === t.id
                ? "bg-blue-100 text-blue-700 font-medium"
                : "hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
