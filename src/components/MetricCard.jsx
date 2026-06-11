import React from 'react';

export default function MetricCard({ icon: Icon, label, value, note, tone = 'blue' }) {
  return (
    <article className={`metric metric-${tone}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
