import classNames from "classnames";
import React from "react";

export default function Button({
  children,
  onClick,
  leftIcon,
  active = false,
  disabled = false,
  backgroundColor = "secondary",
  style,
  outlined = false,
}: {
  children: string;
  leftIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  active?: boolean;
  backgroundColor?: "secondary" | "tint" | "alert";
  outlined?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const _onClick = (event: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(event);
  };

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const originalBg = React.useRef<string | undefined>(undefined);
  const prevActive = React.useRef<boolean>(active);

  const mergedStyle = React.useMemo(() => {
    const s = { fontSize: 16, ...(style || {}) } as React.CSSProperties;
    if (active) {
      // when active, force the active blue and white text regardless of incoming style
      s.backgroundColor = 'white';
      s.color = 'black';
      // colored shadow and border using the active blue
      s.boxShadow = '0px 0px 0px 4px rgba(125, 199, 255, 0.7)';
      s.border = '2px solid #8494FF';

    }
    return s;
  }, [style, active]);

  React.useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    if (prevActive.current !== active) {
      prevActive.current = active;
      if (mergedStyle.backgroundColor) el.style.backgroundColor = mergedStyle.backgroundColor as string;
      else el.style.backgroundColor = '';
      originalBg.current = undefined;
    }
  }, [active, mergedStyle.backgroundColor]);

  const parseHex = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b };
  };

  const parseRgb = (rgb: string) => {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,[^)]+)?\)/);
    if (!m) return null;
    return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
  };

  const darkenColor = (color: any, amount = 0.12) => {
    if (!color) return color;
    let rgb = null as any;
    if (typeof color === 'string') {
      if (color.startsWith('#')) rgb = parseHex(color);
      else if (color.startsWith('rgb')) rgb = parseRgb(color);
    }
    if (!rgb) return color;
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * (1 - amount))));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * (1 - amount))));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * (1 - amount))));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    const el = buttonRef.current;
    const bg = mergedStyle && (mergedStyle as any).backgroundColor;
    if (el && bg) {
      if (!originalBg.current) originalBg.current = el.style.backgroundColor || bg;
      el.style.backgroundColor = darkenColor(bg, 0.06);
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    const el = buttonRef.current;
    if (el && originalBg.current !== undefined) {
      el.style.backgroundColor = originalBg.current;
      originalBg.current = undefined;
    }
  };

  const handleMouseDown = () => {
    if (disabled) return;
    const el = buttonRef.current;
    const bg = mergedStyle && (mergedStyle as any).backgroundColor;
    if (el && bg) {
      el.style.backgroundColor = darkenColor(bg, 0.18);
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;
    const el = buttonRef.current;
    const bg = mergedStyle && (mergedStyle as any).backgroundColor;
    if (el && bg) {
      el.style.backgroundColor = darkenColor(bg, 0.06);
    }
  };
  return (
    <button
      ref={buttonRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={classNames(
        "w-20 h-10 rounded-xs flex items-center justify-center",
        "text-sm font-medium select-none",
        "text-gray-700 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-800/50",
        "transition-all duration-150 cursor-pointer",
        "hover:bg-gray-200 hover:text-gray-900 hover:shadow-sm",
        active && "bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:text-white dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:shadow-none",
        outlined && "border border-primary",
        backgroundColor === "tint" && "bg-tint dark:bg-dark-tint text-white",
        backgroundColor === "alert" && "bg-alert text-white"
      )}
      onClick={_onClick}
      style={mergedStyle}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
}
