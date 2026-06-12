import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PanelTitle({ icon: Icon, title, action }) {
  const isActionNode = React.isValidElement(action);
  const actionText = isActionNode ? '' : `${action || ''}`.trim();
  return (
    <div className="panel-title">
      <div>
        <Icon size={18} />
        <strong>{title}</strong>
      </div>
      {action ? (
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {isActionNode ? action : <span className="panel-title-text-action">{actionText}<ChevronRight size={14} /></span>}
        </div>
      ) : null}
    </div>
  );
}
