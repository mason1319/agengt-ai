import { formatCurrencyCents, normalizeCourseClassType, normalizeCourseFee } from './formatters';

export function normalizeCourseTime(course = {}, fallback = '未安排时段') {
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

export function getCourseDisplay(course = {}, fallbackTime = '未安排时段') {
  return {
    name: `${course.name || course.courseName || course.title || course.course || course.courseTitle || '课程名称未设置'}`.trim(),
    course: course.course || course.name || course.courseName || course.title || '课程练习卡',
    fee: normalizeCourseFee(course),
    classType: normalizeCourseClassType(course),
    time: normalizeCourseTime(course, fallbackTime)
  };
}

export function normalizeCourseRules(course = {}) {
  const scheduleDate = `${course.schedule_date || course.scheduleDate || course.classDate || course.start_date || course.startDate || '日期未设置'}`.trim();
  const attendanceRule = `${course.attendance_rule || course.attendanceRule || '到课后正常扣课；请假与缺课按机构规则处理'}`.trim();
  const holdRule = `${course.hold_rule || course.holdRule || '请假或停课可保留课时，按机构规则执行'}`.trim();
  return {
    scheduleDate,
    attendanceRule,
    holdRule
  };
}
