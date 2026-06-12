import React from 'react';

export default function AppShell({ sidebar, topbar, homeStrip, children }) {
  return (
    <main className="app-shell">
      {sidebar}
      <section className="workspace">
        {topbar}
        <div className="workspace-stack">
          {homeStrip}
          {children}
        </div>
      </section>
    </main>
  );
}
