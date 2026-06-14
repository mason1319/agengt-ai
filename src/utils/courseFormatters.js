import { COURSE_COPY, formatCurrencyCents, normalizeCourseClassType, normalizeCourseFee } from './formatters';

export function normalizeCourseTime(course = {}, fallback = COURSE_COPY.timeFallback) {
  const raw = `${course.start_time || course.startAt || course.startTime || course.time_slot || course.timeSlot || course.schedule || course.time || course.class_time || fallback}`.trim();
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return raw || fallback;
}

export function normalizeCourseStatus(course = {}, fallback = COURSE_COPY.statusFallback) {
  const raw = `${course.status || course.statusText || ''}`.trim();
  if (!raw) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  if (normalized === 'active' || normalized === 'ongoing' || normalized === 'running') {
    return '进行中';
  }
  if (normalized === 'paused' || normalized === 'hold' || normalized === 'suspended') {
    return '已暂停';
  }
  if (normalized === 'closed' || normalized === 'finished' || normalized === 'completed') {
    return '已结课';
  }
  if (normalized === 'draft' || normalized === 'pending') {
    return '待开启';
  }

  return raw;
}

export function getCourseDisplay(course = {}, fallbackTime = COURSE_COPY.timeFallback) {
  return {
    name: `${course.name || course.courseName || course.title || course.course || course.courseTitle || COURSE_COPY.courseNameFallback}`.trim(),
    course: course.course || course.name || course.courseName || course.title || COURSE_COPY.currentCourseFallback,
    fee: normalizeCourseFee(course),
    classType: normalizeCourseClassType(course),
    time: normalizeCourseTime(course, fallbackTime)
  };
}

export function normalizeCourseRules(course = {}) {
  const scheduleDate = `${course.schedule_date || course.scheduleDate || course.classDate || course.start_date || course.startDate || COURSE_COPY.scheduleDateFallback}`.trim();
  const attendanceRule = `${course.attendance_rule || course.attendanceRule || '到课后正常扣课；请假与缺课按机构规则处理'}`.trim();
  const holdRule = `${course.hold_rule || course.holdRule || '请假或停课可保留课时，按机构规则执行'}`.trim();
  return {
    scheduleDate,
    attendanceRule,
    holdRule
  };
}
