import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <div
      className={`bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
