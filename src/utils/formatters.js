export function formatCurrencyCents(value = 0) {
  return `¥${((Number(value) || 0) / 100).toFixed(2)}`;
}

export function normalizeCourseClassType(course = {}) {
  const raw = `${course.class_type || course.classType || course.groupType || course.mode || ''}`.trim().toLowerCase();
  if (!raw) {
    return '班型未设置';
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
  return course.classType || course.groupType || course.mode || '班型未设置';
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

  return '价格未设置';
}
