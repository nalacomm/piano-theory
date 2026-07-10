'use client';
import { useState } from 'react';

interface PlayBtnProps {
  onPlay: () => void;
  label?: string;
  color?: string;
  small?: boolean;
}

export default function PlayBtn({ onPlay, label = 'Play', color = 'var(--green)', small = false }: PlayBtnProps) {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(true);
    onPlay();
    setTimeout(() => setActive(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: active ? color : 'transparent',
        border: `1px solid ${color}`,
        color: active ? 'var(--on-accent)' : color,
        borderRadius: 'var(--radius-sm)',
        padding: small ? '4px 10px' : '6px 14px',
        fontSize: small ? 11 : 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span>{active ? '▶' : '▷'}</span>
      {label}
    </button>
  );
}
