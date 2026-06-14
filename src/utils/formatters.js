export const COURSE_COPY = {
  classTypeFallback: '班型待确认',
  feeFallback: '收费标准待确认',
  timeFallback: '时间待确认',
  courseNameFallback: '课程名称待确认',
  scheduleDateFallback: '上课日期待确认',
  gradeFallback: '年级待确认',
  statusFallback: '课程状态待确认',
  paymentStatusFallback: '收费状态待确认',
  paymentTimeFallback: '入账时间待确认',
  currentCourseFallback: '课程待排课',
  expiryFallback: '到期日待确认',
  renewalFallback: '续期日待确认'
};

export function formatCurrencyCents(value = 0) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

export function normalizeLessonHours(value = 0, fallback = '课时待确认') {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return fallback;
  }
  const rounded = Math.round(normalized * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)} 节`;
}

export function normalizePaidAmount(value = '', fallback = '收费金额未录入') {
  const raw = `${value ?? ''}`.trim();
  if (!raw) {
    return fallback;
  }
  if (/^¥/.test(raw) || /元$/.test(raw)) {
    return raw;
  }

  const normalized = Number(raw);
  if (!Number.isFinite(normalized)) {
    return raw;
  }
  if (Math.abs(normalized) >= 100 && Number.isInteger(normalized)) {
    return formatCurrencyCents(normalized);
  }
  return Number.isInteger(normalized) ? `${normalized}元` : `¥${normalized.toFixed(2)}`;
}

function normalizeDateText(value = '', fallback = '日期待确认') {
  const raw = `${value ?? ''}`.trim();
  if (!raw) {
    return fallback;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return raw;
}

export function normalizeExpiryRenewalDates(record = {}) {
  const expiresAt = record.expiresAt || record.expires_at || record.expiryAt || record.expiry_at || record.expiredAt || record.expired_at || '';
  const renewalAt = record.renewalAt || record.renewal_at || record.renewedAt || record.renewed_at || record.nextRenewalAt || record.next_renewal_at || '';

  return {
    dueText: `到期日：${normalizeDateText(expiresAt, COURSE_COPY.expiryFallback)}`,
    renewalText: `续期日：${normalizeDateText(renewalAt, COURSE_COPY.renewalFallback)}`
  };
}

export function normalizeCourseClassType(course = {}) {
  const raw = `${course.class_type || course.classType || course.groupType || course.mode || ''}`.trim().toLowerCase();
  if (!raw) {
    return COURSE_COPY.classTypeFallback;
  }

  if (raw.includes('1对1') || raw.includes('1v1') || raw.includes('一对一') || raw.includes('one-to-one') || raw.includes('individual')) {
    return '一对一';
  }
  if (raw.includes('小班') || raw.includes('group') || raw.includes('small')) {
    return '小班课';
  }
  if (raw.includes('大班') || raw.includes('lecture') || raw.includes('large')) {
    return '大班课';
  }
  return course.classType || course.groupType || course.mode || COURSE_COPY.classTypeFallback;
}

export function normalizeCourseFee(course = {}) {
  const explicit = `${course.fee || course.feeLabel || course.price || course.priceLabel || ''}`.trim();
  if (explicit) {
    return explicit;
  }

  const cents = Number(course.priceCents || course.amountCents || course.feeCents || 0);
  if (Number.isFinite(cents) && cents > 0) {
    return formatCurrencyCents(cents);
  }

  const flat = Number(course.price || course.fee || 0);
  if (Number.isFinite(flat) && flat > 0) {
    return Number.isInteger(flat) ? `${flat}元` : formatCurrencyCents(flat * 100);
  }

  return COURSE_COPY.feeFallback;
}

export function normalizePaymentStatus(status = '', fallback = '未设置') {
  const raw = `${status || ''}`.trim();
  if (!raw) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  if (
    normalized === 'paid'
    || normalized === 'paid_success'
    || normalized === 'settled'
    || normalized === 'success'
    || normalized === 'collected'
    || normalized === 'received'
    || normalized.includes('已收')
    || normalized.includes('已入账')
  ) {
    return '已收';
  }
  if (
    normalized === 'pending'
    || normalized === 'unpaid'
    || normalized === 'due'
    || normalized === 'unreceived'
    || normalized.includes('待收')
  ) {
    return '待收';
  }
  if (
    normalized === 'refunded'
    || normalized === 'refund'
    || normalized.includes('已退')
  ) {
    return '已退';
  }
  if (normalized === 'processing' || normalized.includes('处理中')) {
    return '处理中';
  }

  return raw;
}

export function normalizeReviewStatus(status = '', fallback = '已回填', kind = 'history') {
  const raw = `${status || ''}`.trim();
  if (!raw) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  if (
    normalized === 'done'
    || normalized === 'completed'
    || normalized === 'complete'
    || normalized === 'submitted'
    || normalized === 'graded'
    || normalized === 'reviewed'
    || normalized === 'finished'
    || normalized === 'success'
    || normalized === 'ok'
    || normalized.includes('已完成')
    || normalized.includes('已提交')
    || normalized.includes('已回填')
    || normalized.includes('已批改')
  ) {
    return '已完成';
  }
  if (
    normalized === 'pending'
    || normalized === 'todo'
    || normalized === 'draft'
    || normalized === 'unstarted'
    || normalized.includes('待复习')
  ) {
    return kind === 'mistake' ? '待复习' : '进行中';
  }
  if (
    normalized === 'processing'
    || normalized === 'running'
    || normalized === 'in_progress'
    || normalized.includes('进行中')
  ) {
    return '进行中';
  }

  return raw;
}
