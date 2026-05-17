import React from 'react';

interface HistorySummaryProps {
  total: number;
  confirmed: number;
  rate: number;
}

const HistorySummary: React.FC<HistorySummaryProps> = ({ total, confirmed, rate }) => {
  return (
    <div className="bg-[#e2e7ff] rounded-2xl p-3 flex items-center justify-between border border-[#bacac5]/20">
      <div className="text-[12px] font-semibold text-[#131b2e]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Total Appointments This Month: <span className="font-extrabold">{total}</span>
      </div>
      <div className="text-[12px] font-semibold text-[#131b2e]" style={{ fontFamily: 'Inter, sans-serif' }}>
        Confirmed: <span className="font-extrabold">{confirmed} ({rate}%)</span>
      </div>
    </div>
  );
};

export default HistorySummary;
