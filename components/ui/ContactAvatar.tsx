import React from 'react';

interface ContactAvatarProps {
  name: string;
  src: string;
  size?: string;
  className?: string;
}

const ContactAvatar: React.FC<ContactAvatarProps> = ({ 
  name, 
  src, 
  size = 'w-14 h-14', 
  className = '' 
}) => {
  return (
    <img
      alt={name}
      className={`${size} rounded-full object-cover border border-slate-200 dark:border-white/10 ${className}`}
      src={src}
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      }}
    />
  );
};

export default ContactAvatar;
