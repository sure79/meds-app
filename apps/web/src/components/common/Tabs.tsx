import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-navy-600 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-navy-500'
              }
            `}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
