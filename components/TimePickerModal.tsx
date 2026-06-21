import React, { useState, useEffect, useRef } from 'react';

interface TimePickerModalProps {
  initialTime?: string; // in "HH:MM" 24h format
  onClose: () => void;
  onSet: (time: string) => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({ initialTime, onClose, onSet }) => {
  // Parse initial time
  let initialHour = '12';
  let initialMinute = '00';
  let initialAmpm = 'pm';

  if (initialTime && initialTime.includes(':')) {
    const [hStr, mStr] = initialTime.split(':');
    const h = parseInt(hStr);
    initialMinute = mStr.padStart(2, '0');
    
    if (h >= 12) {
      initialAmpm = 'pm';
      initialHour = String(h === 12 ? 12 : h - 12);
    } else {
      initialAmpm = 'am';
      initialHour = String(h === 0 ? 12 : h);
    }
  }

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [ampm, setAmpm] = useState<'am' | 'pm'>(initialAmpm as 'am' | 'pm');

  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);

  // Focus hour input on mount
  useEffect(() => {
    if (hourRef.current) {
      hourRef.current.focus();
      hourRef.current.select();
    }
  }, []);

  const handleHourChange = (val: string) => {
    // Only allow digits
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(-1);
    }
    
    setHour(cleaned);

    // Auto-focus minute if:
    // 1. 2 digits entered and valid (e.g., 10, 11, 12, or 01, 02)
    // 2. Or a single digit between 2 and 9 is entered (since hours are 1-12)
    if (cleaned.length === 2) {
      const hNum = parseInt(cleaned);
      if (hNum >= 1 && hNum <= 12) {
        minuteRef.current?.focus();
        minuteRef.current?.select();
      }
    } else if (cleaned.length === 1) {
      const hNum = parseInt(cleaned);
      if (hNum >= 2 && hNum <= 9) {
        minuteRef.current?.focus();
        minuteRef.current?.select();
      }
    }
  };

  const handleHourBlur = () => {
    const currentVal = hourRef.current?.value || '';
    if (!currentVal) {
      setHour('12');
      return;
    }
    const hNum = parseInt(currentVal);
    if (isNaN(hNum) || hNum < 1 || hNum > 12) {
      setHour('12');
    } else {
      setHour(String(hNum));
    }
  };

  const handleMinuteChange = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(-1);
    }
    setMinute(cleaned);
  };

  const handleMinuteBlur = () => {
    const currentVal = minuteRef.current?.value || '';
    if (!currentVal) {
      setMinute('00');
      return;
    }
    const mNum = parseInt(currentVal);
    if (isNaN(mNum) || mNum < 0 || mNum > 59) {
      setMinute('00');
    } else {
      setMinute(String(mNum).padStart(2, '0'));
    }
  };

  const handleClear = () => {
    setHour('');
    setMinute('');
    hourRef.current?.focus();
  };

  const handleSet = () => {
    let hNum = parseInt(hour);
    let mNum = parseInt(minute);

    if (isNaN(hNum) || hNum < 1 || hNum > 12) hNum = 12;
    if (isNaN(mNum) || mNum < 0 || mNum > 59) mNum = 0;

    // Convert to 24h
    let h24 = hNum;
    if (ampm === 'pm' && hNum !== 12) {
      h24 = hNum + 12;
    } else if (ampm === 'am' && hNum === 12) {
      h24 = 0;
    }

    const formattedTime = `${String(h24).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
    onSet(formattedTime);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[310px] bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#006b5f] px-6 py-4 flex items-center">
          <span className="text-[12px] font-bold text-white uppercase tracking-wider">Set time</span>
        </div>

        {/* Content */}
        <div className="p-6 pb-4">
          <div className="text-[12px] font-medium text-slate-400 dark:text-slate-500 mb-6">
            Enter time
          </div>

          <div className="flex items-end justify-center gap-2 mb-6">
            {/* Hour Block */}
            <div className="flex flex-col items-center">
              <input
                ref={hourRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={hour}
                onChange={(e) => handleHourChange(e.target.value)}
                onBlur={handleHourBlur}
                onFocus={(e) => e.target.select()}
                className="w-[72px] h-[72px] text-center text-[44px] font-light bg-slate-50 dark:bg-slate-800 border-b-2 border-[#006b5f] text-slate-800 dark:text-slate-100 rounded-t-md focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">hour</span>
            </div>

            {/* Separator */}
            <span className="text-[44px] font-light text-slate-600 dark:text-slate-400 pb-5 leading-none">:</span>

            {/* Minute Block */}
            <div className="flex flex-col items-center">
              <input
                ref={minuteRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minute}
                onChange={(e) => handleMinuteChange(e.target.value)}
                onBlur={handleMinuteBlur}
                onFocus={(e) => e.target.select()}
                className="w-[72px] h-[72px] text-center text-[44px] font-light bg-slate-50 dark:bg-slate-800 border-b-2 border-[#006b5f] text-slate-800 dark:text-slate-100 rounded-t-md focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">minute</span>
            </div>

            {/* AM/PM Selector */}
            <div className="ml-3 self-center pb-4 relative">
              <select
                value={ampm}
                onChange={(e) => setAmpm(e.target.value as 'am' | 'pm')}
                className="bg-transparent border-b border-slate-300 dark:border-slate-700 text-[16px] text-slate-700 dark:text-slate-300 py-1 pr-6 pl-1 focus:outline-none appearance-none cursor-pointer font-medium uppercase"
              >
                <option value="am" className="bg-white dark:bg-slate-900">am</option>
                <option value="pm" className="bg-white dark:bg-slate-900">pm</option>
              </select>
              <span className="material-symbols-outlined text-[14px] text-slate-400 absolute right-0 top-[6px] pointer-events-none">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/40">
          {/* Clock Icon on Bottom Left */}
          <button 
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#006b5f] text-[12px] font-bold tracking-wider hover:bg-[#006b5f]/5 px-2 py-1.5 rounded transition-colors"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#006b5f] text-[12px] font-bold tracking-wider hover:bg-[#006b5f]/5 px-2 py-1.5 rounded transition-colors"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSet}
              className="text-[#006b5f] text-[12px] font-bold tracking-wider hover:bg-[#006b5f]/5 px-2 py-1.5 rounded transition-colors"
            >
              SET
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TimePickerModal;
