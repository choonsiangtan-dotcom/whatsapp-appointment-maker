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
    <div
      onClick={onChange}
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 cursor-pointer shadow-inner flex-shrink-0 ${
        enabled ? 'bg-[#006b5f]' : 'bg-[#bacac5]/40'
      } ${className}`}
    >
      <div className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
        enabled ? 'translate-x-[26px]' : 'translate-x-1'
      }`} />
    </div>
  );
};

export default ToggleSwitch;
