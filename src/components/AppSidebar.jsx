import React from 'react';
import BrandLogo from './BrandLogo';
import AggieMascotArt from './AggieMascotArt';

export default function AppSidebar({
  pageConfig = [],
  activePage = 'home',
  onNavigatePage,
  child = {},
  currentStage = {},
  activeRole = '',
  currentPage = {},
  requiresAuth = false,
  authUser = null,
  authGuardedRole = '',
  getRoleLabel = (value) => value,
  currentRole = {},
  roleTabs = [],
  onSwitchRole,
  onLogout,
  appCopy = {},
  showAdminLink = false
}) {
  const progress = Math.min(100, Math.max(Number(child.progress || 0), 12));
  const level = Math.max(1, Math.round(Number(child.progress || 0) / 10) || 1);

  return (
    <aside className="sidebar">
      <BrandLogo
        brandZh={appCopy.brandZh || 'Aggie速记英语'}
        brandEn={appCopy.brandEn || 'Aggie English'}
        brandTag="少儿英语学习与家校协同"
      />
      <nav>
        {pageConfig.map((item) => (
          <a
            className={activePage === item.id ? 'selected' : ''}
            href={`#${item.label}`}
            key={item.label}
            onClick={(e) => {
              e.preventDefault();
              onNavigatePage?.(item.id);
            }}
          >
            <item.icon size={18} />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-card demo-switch-card">
        <div className="sidebar-profile">
          <AggieMascotArt className="compact sidebar-mascot" />
          <div>
            <strong>{child.name}</strong>
            <small>{child.grade || currentStage.label} · Lv.{level}</small>
          </div>
        </div>
        <div className="sidebar-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>{currentStage.label}</strong>
        <small>{activeRole === 'student' ? `坚持学习第 ${Math.max(1, Math.round(Number(child.progress || 0) / 2) || 1)} 天` : `当前页面：${currentPage.label}`}</small>
        {requiresAuth ? (
          <>
            <small>当前登录：{authUser?.name || getRoleLabel(authGuardedRole || activeRole)}</small>
            <small>身份：{getRoleLabel(authGuardedRole || activeRole)}</small>
            <div className="admin-auth-actions">
              <button className="admin-logout-button" onClick={onLogout}>
                退出登录
              </button>
            </div>
          </>
        ) : activeRole === 'platform' ? (
          <small>当前身份：{currentRole?.label || '学生'}</small>
        ) : null}
        {activeRole === 'platform' ? (
          <div className="demo-role-tabs">
            {roleTabs.map((tab) => (
              <button
                className={activeRole === tab.id ? 'active' : ''}
                key={tab.id}
                onClick={() => onSwitchRole?.(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
        {showAdminLink ? (
          <div style={{ marginTop: '10px' }}>
            <a
              className="admin-login-btn"
              href="/admin"
              style={{ width: '100%', display: 'inline-flex', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}
            >
              管理登录 /admin
            </a>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
