
import React from 'react';

interface InputFieldProps {
  label: string;
  icon: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
  onSuggestionClick?: (val: string) => void;
  type?: string;
  showVerified?: boolean;
}

const IconMap: Record<string, React.ReactNode> = {
  location_on: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  event: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  )
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  className = "",
  suggestions = [],
  onSuggestionClick,
  type,
  showVerified = true
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={`group transition-all duration-300 ${className}`}>
      <div className="relative flex items-center">
        <div className="w-full bg-white border border-slate-100 rounded-[1.5rem] flex items-center transition-all duration-300 group-hover:border-emerald-200 shadow-sm overflow-hidden">
          <div className="flex-shrink-0 ml-4 flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 text-emerald-600">
            <span className="material-icons-round text-xl">{icon}</span>
          </div>
          <div className="flex-1 px-4 py-3 flex flex-col justify-center min-h-[3.5rem]">
            <input
              className="w-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-slate-900 placeholder-slate-300 font-semibold py-0 px-0 text-sm"
              placeholder={placeholder}
              type={type}
              value={value}
              onChange={onChange}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onFocus={() => setIsFocused(true)}
            />
            {value && icon !== 'search' && showVerified && (
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">Verified</span>
            )}
          </div>
        </div>
      </div>

        {/* Suggestions Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={() => onSuggestionClick?.(s)}
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left text-sm text-slate-700 dark:text-slate-300 transition-colors border-b last:border-b-0 border-slate-100 dark:border-white/5"
              >
                <span className="material-icons-round text-slate-400 mr-3 text-base">history</span>
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}
    </div>
  );
};

export default InputField;
