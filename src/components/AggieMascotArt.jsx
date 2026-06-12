import React from 'react';

export default function AggieMascotArt({ className = '' }) {
  return (
    <div className={`aggie-mascot-art ${className}`.trim()} aria-hidden="true">
      <span className="aggie-mascot-bg" />
      <span className="aggie-mascot-ear left" />
      <span className="aggie-mascot-ear right" />
      <span className="aggie-mascot-head" />
      <span className="aggie-mascot-face" />
      <span className="aggie-mascot-eye left" />
      <span className="aggie-mascot-eye right" />
      <span className="aggie-mascot-mouth" />
      <span className="aggie-mascot-scarf" />
      <span className="aggie-mascot-cheek left" />
      <span className="aggie-mascot-cheek right" />
    </div>
  );
}
