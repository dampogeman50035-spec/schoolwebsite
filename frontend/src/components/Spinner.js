import React from "react";

export default function Spinner({ size = 36 }) {
  const s = Math.max(16, size);
  return (
    <div style={{ width: s, height: s, display: "inline-block" }}>
      <div className="spinner" style={{ width: s, height: s, borderWidth: Math.max(2, Math.round(s / 8)) }} />
    </div>
  );
}
