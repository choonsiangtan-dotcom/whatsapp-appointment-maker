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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 border border-white/20 cursor-pointer ${
        enabled ? 'bg-primary/20 neon-glow-toggle' : 'bg-slate-200 dark:bg-white/10'
      } ${className}`}
    >
      <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ring-2 ${
        enabled ? 'translate-x-6 bg-primary ring-primary/20' : 'translate-x-1 ring-transparent'
      }`} />
    </button>
  );
};

export default ToggleSwitch;
