import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  hero?: boolean;
  valueClass?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  hero = false,
  valueClass = ''
}) => {
  return (
    <div
      className={`border rounded-[10px] p-4 shadow-sm transition-all ${
        hero
          ? 'bg-[#DBEDEE] border-[#0B6E78]/30 shadow-md'
          : 'bg-white border-[#D2E0E0]'
      }`}
    >
      <div className="text-[11px] tracking-wider uppercase font-semibold text-[#7A9296]">
        {label}
      </div>
      <div
        className={`text-[23px] font-semibold tracking-tight mt-1.5 font-mono ${
          hero ? 'text-[#0B6E78]' : valueClass || 'text-[#0F262A]'
        }`}
      >
        {value}
      </div>
      <div className="text-[12px] text-[#4C666A] mt-1 truncate">
        {subtitle}
      </div>
    </div>
  );
};
