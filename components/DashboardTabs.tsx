'use client';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export default function DashboardTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            active === tab.id
              ? 'text-primary-700 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
