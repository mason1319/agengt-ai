import React from 'react';

export default function BrandLogo({
  brandZh = 'Aggie速记英语',
  brandEn = 'Aggie English',
  brandTag = '少儿英语学习与家校协同'
}) {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">A</span>
      <div className="brand-wordmark">
        <strong>{brandZh}</strong>
        <small>{brandEn}</small>
        <span>{brandTag}</span>
      </div>
    </div>
  );
}
