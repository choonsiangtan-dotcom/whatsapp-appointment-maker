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
  suggestionIcon?: string;
}

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
  showVerified = true,
  suggestionIcon = "history"
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={`group relative transition-all duration-300 ${className}`}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#006b5f] text-[18px]">
          {icon}
        </span>
        <input
          className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] focus:ring-2 focus:ring-[#006b5f]/30 focus:border-[#006b5f] outline-none transition-all placeholder:text-[#6b7a76]/40 txt-secondary text-[#131b2e] dark:text-slate-100"
          placeholder={placeholder}
          type={type || "text"}
          value={value}
          onChange={onChange}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[16px] shadow-lg shadow-slate-200/20 dark:shadow-none z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => onSuggestionClick?.(s)}
              className="w-full flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left text-sm text-[#131b2e] dark:text-slate-200 transition-colors border-b last:border-b-0 border-slate-100 dark:border-slate-800/50"
            >
              <span className="material-symbols-outlined text-[#006b5f] mr-3 text-[18px]">{suggestionIcon}</span>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputField;
