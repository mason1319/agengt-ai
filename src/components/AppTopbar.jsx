import React from 'react';

export default function AppTopbar({
  currentPage = null,
  shellTitle = '',
  actionCount = 0,
  activeRole = '',
  ageGroups = [],
  activeStage = '',
  onSwitchStage
}) {
  if (!currentPage) {
    return null;
  }

  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <span>{shellTitle}</span>
        <h2><currentPage.icon size={24} /> {currentPage.label}</h2>
        {currentPage.hint ? <small className="topbar-hint">{currentPage.hint}</small> : null}
        <small className="action-ticker">
          {activeRole === 'platform' ? `本次会话操作：${actionCount}` : '页面内容已同步'}
        </small>
      </div>
      {activeRole === 'platform' ? null : (
        <div className="topbar-stage-rail">
          <div className="role-tabs top-stage-tabs">
            {ageGroups.map((tab) => (
              <button
                className={activeStage === tab.id ? 'active' : ''}
                key={tab.id}
                onClick={() => onSwitchStage?.(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <small className="topbar-stage-note">
            {activeStage ? `当前阶段：${activeStage}` : '阶段切换已就绪'}
          </small>
        </div>
      )}
    </header>
  );
}
