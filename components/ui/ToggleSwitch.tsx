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
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none flex-shrink-0 ${
        enabled 
          ? 'bg-[#006b5f] dark:bg-[#006b5f]' 
          : 'bg-slate-200 dark:bg-slate-800'
      } ${className}`}
    >
      <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
        enabled ? 'translate-x-[23px]' : 'translate-x-[3px]'
      }`} />
    </button>
  );
};

export default ToggleSwitch;
