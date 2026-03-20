import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  id,
}: SelectProps) {
  const selectId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs text-gray-400 font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full bg-navy-800 border border-navy-600 rounded-md px-3 py-2 text-sm text-gray-200
          outline-none transition-colors cursor-pointer
          focus:border-accent
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
