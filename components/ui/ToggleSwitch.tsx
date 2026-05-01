import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  enabled, 
  onChange,
  className = ''
}) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 cursor-pointer ${
        enabled ? 'bg-emerald-500 neon-glow-toggle' : 'bg-slate-300 dark:bg-slate-700'
      } ${className}`}
    >
      <div className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
};

export default ToggleSwitch;
