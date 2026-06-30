import React from "react";

export function DotGrid({ className = "", dark = false }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: dark
          ? `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`
          : `radial-gradient(rgba(15,45,92,0.09) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    />
  );
}

export function MeshGlow({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-400/15 blur-[90px]" />
      <div className="absolute top-1/2 left-1/3 h-[280px] w-[280px] rounded-full bg-violet-500/10 blur-[80px]" />
    </div>
  );
}
