import React from 'react';

interface OverlappingAvatarsProps {
  avatars: string[];
  names: string[];
  onAvatarClick?: (index: number) => void;
}

const OverlappingAvatars: React.FC<OverlappingAvatarsProps> = ({ avatars, names, onAvatarClick }) => {
  return (
    <div className="flex -space-x-3 overflow-hidden ml-1">
      {avatars.slice(0, 3).map((src, i) => (
        <div 
          key={i} 
          onClick={(e) => {
            console.log('Avatar click triggered for index:', i);
            if (onAvatarClick) {
              e.stopPropagation();
              onAvatarClick(i);
            }
          }}
          className="inline-block h-10 w-10 rounded-full ring-[3px] ring-slate-50 overflow-hidden bg-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
          style={{ zIndex: i + 1 }}
        >
          <img
            className="h-full w-full object-cover"
            src={src}
            alt={names[i]}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(names[i] || 'U')}&background=random`;
            }}
          />
        </div>
      ))}
      {avatars.length > 3 && (
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-[3px] ring-white text-[10px] font-bold text-slate-500 shadow-sm"
          style={{ zIndex: 10 }}
        >
          +{avatars.length - 3}
        </div>
      )}
    </div>
  );
};

export default OverlappingAvatars;
