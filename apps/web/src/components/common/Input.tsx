import React from 'react';

interface InputProps {
  label?: string;
  unit?: string;
  error?: string;
  type?: 'text' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  id?: string;
}

export default function Input({
  label,
  unit,
  error,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  min,
  max,
  step,
  className = '',
  id,
}: InputProps) {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs text-gray-400 font-medium">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`
            w-full bg-navy-800 border rounded-md px-3 py-2 text-sm text-gray-200
            outline-none transition-colors font-mono
            ${error ? 'border-danger' : 'border-navy-600 focus:border-accent'}
            ${unit ? 'pr-12' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        {unit && (
          <span className="absolute right-3 text-xs text-gray-500 font-mono">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <span className="text-xs text-danger">{error}</span>
      )}
    </div>
  );
}
