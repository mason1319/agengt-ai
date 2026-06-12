const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatus = (value, fallback) => {
  const normalized = `${value || ''}`.trim();
  return normalized || fallback;
};

const toIntText = (value, fallback = 0) => {
  const n = toNumber(value, fallback);
  return `${Math.max(0, Math.round(n))}`;
};

const mapPlanName = (planCode = 'trial') => {
  switch (planCode) {
    case 'basic':
      return '基础版';
    case 'standard':
      return '标准版';
    case 'pro':
      return '专业版';
    case 'trial':
    default:
      return '体验版';
  }
};

const planLimitMap = {
  trial: { students: 50, teachers: 3, ai: 300, modeDays: 14 },
  basic: { students: 100, teachers: 5, ai: 2000, modeDays: 30 },
  standard: { students: 500, teachers: 20, ai: 10000, modeDays: 30 },
  pro: { students: 2000, teachers: 80, ai: 50000, modeDays: 30 }
};

function normalizeInstituteRow(row = {}) {
  const planCode = normalizeStatus(row.plan_code, 'trial');
  const limit = planLimitMap[planCode] || planLimitMap.trial;

  const students = toNumber(row.student_count, 0);
  const teachers = toNumber(row.teacher_count, 0);
  const aiUsed = toNumber(row.ai_used_month, 0);
  const aiLimit = toNumber(row.ai_limit_monthly, limit.ai);

  return {
    id: row.id,
    name: normalizeStatus(row.name, ''),
    planCode,
    plan: mapPlanName(planCode),
    planMode: normalizeStatus(row.plan_mode, 'monthly') === 'yearly' ? '年付' : '月付',
    status: normalizeStatus(row.status, 'trial'),
    students,
    teachers,
    limitStudents: toNumber(row.student_limit || limit.students, limit.students),
    limitTeachers: toNumber(row.teacher_limit || limit.teachers, limit.teachers),
    aiUsed,
    aiLimit,
    aiLeft: Math.max(aiLimit - aiUsed, 0),
    expires: normalizeStatus(row.subscription_ends_at, normalizeStatus(row.trial_ends_at, '')),
    trialEndsAt: row.trial_ends_at,
    subscriptionStartsAt: row.subscription_starts_at,
    subscriptionEndsAt: row.subscription_ends_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

function normalizeStudentRow(row = {}) {
  return {
    id: row.id,
    name: normalizeStatus(row.name, ''),
    grade: normalizeStatus(row.grade, ''),
    course: normalizeStatus(row.course, ''),
    hoursLeft: toNumber(row.hours_left, 0),
    weaknessPoints: row.weakness_points,
    renewalRisk: toNumber(row.renewal_risk, 0),
    teacherId: row.teacher_id || null,
    parent: {
      id: row.parent_id || '',
      name: row.parent_name || '',
      phoneMasked: `${row.parent_phone_encrypted || ''}`,
      wechatMasked: `${row.parent_wechat_encrypted || ''}`,
      source: `${row.parent_source || ''}`
    }
  };
}

function normalizeTeacherRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    username: normalizeStatus(row.username, ''),
    role: normalizeStatus(row.role, 'teacher'),
    name: normalizeStatus(row.name, ''),
    phone: row.phone || '',
    email: row.email || '',
    status: normalizeStatus(row.status, 'active'),
    createdAt: row.created_at || ''
  };
}

function normalizeLeadRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    guardianName: normalizeStatus(row.guardian_name, ''),
    studentGrade: row.student_grade || '',
    needSummary: row.need_summary || '',
    status: normalizeStatus(row.status, 'new'),
    aiRecommendation: row.ai_recommendation || '',
    createdAt: row.created_at || ''
  };
}

function normalizePaymentRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    userId: row.user_id || '',
    orderNo: normalizeStatus(row.order_no, ''),
    amountCents: toNumber(row.amount_cents, 0),
    currency: normalizeStatus(row.currency || 'CNY', 'CNY'),
    planCode: normalizeStatus(row.plan_code || 'trial', 'trial'),
    planMode: normalizeStatus(row.plan_mode || 'monthly', 'monthly'),
    periodDays: toNumber(row.period_days, 30),
    status: normalizeStatus(row.status, 'pending'),
    paidAt: row.paid_at || '',
    startsAt: row.starts_at || '',
    expiresAt: row.expires_at || '',
    createdAt: row.created_at || ''
  };
}

function normalizeLessonRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    teacherId: row.teacher_id || '',
    teacherName: row.teacher_name || '',
    topic: row.topic || '',
    status: normalizeStatus(row.status || 'completed', 'completed'),
    hoursUsed: toNumber(row.hours_used, 1),
    teacherNote: row.teacher_note || '',
    parentFeedback: row.parent_feedback || '',
    createdAt: row.created_at || ''
  };
}

function normalizePermissionRow(row = {}) {
  return {
    id: row.id,
    userId: row.user_id,
    institutionId: row.institution_id || row.inst_id || '',
    permissionCode: normalizeStatus(row.permission_code, ''),
    userName: row.user_name || '',
    username: row.username || '',
    userRole: row.user_role || '',
    createdAt: row.created_at || ''
  };
}

function normalizeCourseRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    teacherId: row.teacher_id || '',
    name: row.name || '',
    grade: row.grade || '',
    level: row.level || '',
    classType: row.class_type || '',
    schedule: row.schedule || '',
    startTime: row.start_time || '',
    durationMinutes: toNumber(row.duration_minutes, 0),
    capacity: toNumber(row.capacity, 0),
    priceCents: toNumber(row.price_cents, 0),
    currency: `${row.currency || 'CNY'}`,
    status: normalizeStatus(row.status, 'active'),
    imageUrl: row.image_url || '',
    createdAt: row.created_at || ''
  };
}

function normalizeReviewTaskRow(row = {}) {
  return {
    id: row.id,
    studentId: row.student_id,
    institutionId: row.institution_id,
    taskType: row.task_type || '',
    title: row.title || '',
    answer: row.answer || '',
    score: toNumber(row.score, 0),
    status: normalizeStatus(row.status, 'pending'),
    payload: parseJsonText(row.payload, {}),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  };
}

function normalizeAttendanceRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    courseId: row.course_id,
    studentId: row.student_id,
    teacherId: row.teacher_id || '',
    status: normalizeStatus(row.status, 'absent'),
    note: row.note || '',
    sourceLessonId: row.source_lesson_id || '',
    attendedAt: row.attended_at || '',
    createdAt: row.created_at || ''
  };
}

function normalizeLeadMessageRow(row = {}) {
  return {
    id: row.id,
    leadId: row.lead_id,
    actorRole: row.actor_role || '',
    sender: row.sender || '',
    message: row.message || '',
    tone: row.tone || '',
    createdAt: row.created_at || ''
  };
}

function normalizeTrialBookingRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    leadId: row.lead_id,
    courseId: row.course_id,
    teacherId: row.teacher_id || '',
    reservedAt: row.reserved_at || '',
    durationMinutes: toNumber(row.duration_minutes, 60),
    sourceChannel: row.source_channel || '',
    status: normalizeStatus(row.status, 'pending'),
    notes: row.notes || '',
    createdAt: row.created_at || ''
  };
}

function normalizePaymentRecordRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    studentId: row.student_id || '',
    courseId: row.course_id || '',
    orderNo: row.order_no || '',
    amountCents: toNumber(row.amount_cents, 0),
    currency: row.currency || 'CNY',
    paymentMethod: row.payment_method || '',
    status: normalizeStatus(row.status, 'pending'),
    paidAt: row.paid_at || '',
    notes: row.notes || '',
    createdAt: row.created_at || ''
  };
}

function normalizeEnrollmentRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    courseId: row.course_id,
    studentId: row.student_id,
    status: normalizeStatus(row.enrollment_status, 'active'),
    source: row.source || '',
    createdAt: row.created_at || ''
  };
}

function normalizeVoicePracticeRow(row = {}) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    studentId: row.student_id,
    userId: row.user_id || '',
    taskId: row.task_id || '',
    transcript: row.transcript || '',
    score: toNumber(row.score, 0),
    result: row.result || '',
    suggestions: parseJsonText(row.suggestions, []),
    createdAt: row.created_at || ''
  };
}

function normalizeAiUsageSummaryRow(row = {}) {
  const aiLimitMonthly = toNumber(
    row.ai_limit_monthly,
    toNumber(row.aiLimitMonthly, 0)
  );
  const aiUsedMonth = toNumber(
    row.ai_used_month,
    toNumber(row.aiUsedMonth, 0)
  );
  const aiUsedWindow = toNumber(row.tokens_used_window, 0);

  return {
    institutionId: `${row.institution_id || ''}`,
    institutionName: `${row.institution_name || row.name || ''}`,
    planCode: `${row.plan_code || ''}`,
    plan: mapPlanName(`${row.plan_code || 'trial'}`.trim()),
    aiLimitMonthly,
    aiUsedMonth,
    aiUsedWindow,
    requestsWindow: toNumber(row.request_count_window, 0),
    lastUsedAt: `${row.last_used_at || ''}`,
    aiLeftMonth: Math.max(aiLimitMonthly - aiUsedMonth, 0)
  };
}

function normalizeAiUsageSourceSummaryRow(row = {}) {
  return {
    realRequests: toNumber(row.realRequests, 0),
    mockRequests: toNumber(row.mockRequests, 0),
    unknownRequests: toNumber(row.unknownRequests, 0),
    totalRequests: toNumber(row.totalRequests, 0)
  };
}

function normalizeAiUsageUserRow(row = {}) {
  return {
    userId: `${row.user_id || ''}`,
    userName: `${row.user_name || '匿名用户'}`,
    role: `${row.role || ''}`,
    aiUsedWindow: toNumber(row.tokens_used, 0),
    requestsWindow: toNumber(row.request_count, 0),
    lastUsedAt: `${row.last_used_at || ''}`
  };
}

function normalizeAiAuditSourceSummaryRow(row = {}) {
  return {
    realRequests: toNumber(row.realRequests, 0),
    mockRequests: toNumber(row.mockRequests, 0),
    unknownRequests: toNumber(row.unknownRequests, 0),
    totalRequests: toNumber(row.totalRequests, 0)
  };
}

function parseJsonText(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

const normalizeCultureWallRow = (row = {}) => {
  const kind = `${row.kind || ''}`.trim();
  const payload = parseJsonText(row.payload, {});
  const date = `${row.created_at || ''}`.slice(0, 10);
  const title = `${row.title || ''}`.trim();
  const description = `${row.description || ''}`.trim();

  if (kind === 'video') {
    return {
      id: `${row.id}`,
      kind: 'video',
      title: title || '教学视频',
      description: description || '教学视频',
      date,
      uploader: `${row.uploader || '机构管理员'}`,
      cover: `${row.cover_url || row.media_url || ''}`,
      src: `${row.media_url || ''}`,
      duration: `${row.duration || '--:--'}`,
      status: `${row.status || '已发布'}`
    };
  }

  if (kind === 'photo') {
    return {
      id: `${row.id}`,
      kind: 'photo',
      title: title || '教学照片',
      description: description || '教学照片',
      date,
      uploader: `${row.uploader || '机构管理员'}`,
      src: `${row.media_url || ''}`,
      status: `${row.status || '已发布'}`
    };
  }

  if (kind === 'teacher') {
    return {
      id: `${row.id}`,
      kind: 'teacher',
      name: title || `${payload?.name || '教师'}`,
      title: description || '老师',
      avatar: `${row.media_url || row.cover_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=450&q=80'}`,
      highlights: Array.isArray(payload?.highlights) ? payload.highlights : []
    };
  }

  if (kind === 'feedback') {
    return {
      id: `${row.id}`,
      kind: 'feedback',
      role: `${row.title || '家长反馈'}`,
      author: `${row.description || '匿名'}`,
      text: `${payload?.text || row.media_url || ''}`
    };
  }

  return null;
};

const normalizeCultureWallRows = (rows = []) => {
  const videos = [];
  const photos = [];
  const teachers = [];
  const feedback = [];

  (rows || []).forEach((row) => {
    const item = normalizeCultureWallRow(row);
    if (!item) {
      return;
    }
    if (item.kind === 'video') {
      videos.push(item);
      return;
    }
    if (item.kind === 'photo') {
      photos.push(item);
      return;
    }
    if (item.kind === 'teacher') {
      teachers.push(item);
      return;
    }
    if (item.kind === 'feedback') {
      feedback.push(item);
      return;
    }
  });

  return { videos, photos, teachers, feedback };
};

function safeParseDb(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('[dbLayer] operation failed', error);
      return null;
    }
  };
}

const fetchInstitutionByIdRaw = async (db, institutionId) => {
  const row = await db
    .prepare(
      `SELECT i.*,
         (SELECT COUNT(1) FROM students s WHERE s.institution_id = i.id) AS student_count,
         (SELECT COUNT(1) FROM users u WHERE u.institution_id = i.id AND u.role = 'teacher') AS teacher_count
       FROM institutions i
       WHERE i.id = ?1
       LIMIT 1`
    )
    .bind(institutionId)
    .first();

  if (!row) {
    return null;
  }

  return normalizeInstituteRow(row);
};

const fetchOrganizationsForPlatformRaw = async (db) => {
  const { results } = await db
    .prepare(
      `SELECT i.*,
         (SELECT COUNT(1) FROM students s WHERE s.institution_id = i.id) AS student_count,
         (SELECT COUNT(1) FROM users u WHERE u.institution_id = i.id AND u.role = 'teacher') AS teacher_count
       FROM institutions i
       ORDER BY COALESCE(i.updated_at, i.created_at) DESC`
    )
    .all();

  return (results || []).map(normalizeInstituteRow);
};

const fetchPlatformSummaryRaw = async (db) => {
  const { results } = await db
    .prepare(
      `SELECT
         (SELECT COUNT(1) FROM institutions) AS institution_total,
         (SELECT COUNT(1) FROM institutions WHERE status = 'expired') AS expired_count,
         (SELECT COUNT(1) FROM institutions WHERE status IN ('normal', 'trial')) AS active_like,
         (SELECT COUNT(1) FROM users WHERE role IN ('founder', 'teacher', 'parent', 'student')) AS user_total,
         (SELECT COUNT(1) FROM students) AS student_total`
    )
    .all();

  const row = results?.[0] || {};
  return {
    institutionTotal: toIntText(row.institution_total, 0),
    activeCount: toIntText(row.active_like, 0),
    expiredCount: toIntText(row.expired_count, 0),
    userTotal: toIntText(row.user_total, 0),
    studentTotal: toIntText(row.student_total, 0)
  };
};

const fetchStudentsByInstitutionRaw = async (db, institutionId, maxRows = 100) => {
  const safeLimit = Math.min(Math.max(toNumber(maxRows, 100), 1), 500);
  const { results } = await db
    .prepare(
      `SELECT s.id, s.name, s.grade, s.weakness_points, s.renewal_risk,
              g.id AS parent_id,
              g.name AS parent_name,
              g.phone_encrypted AS parent_phone_encrypted,
              g.wechat_encrypted AS parent_wechat_encrypted,
              g.source AS parent_source,
              COALESCE(
                (SELECT remaining_hours FROM lesson_accounts a WHERE a.student_id = s.id ORDER BY a.created_at DESC LIMIT 1),
                0
              ) AS hours_left,
              s.teacher_id
       FROM students s
       LEFT JOIN guardians g ON g.id = s.guardian_id
       WHERE s.institution_id = ?1
       ORDER BY s.created_at DESC
       LIMIT ${safeLimit}`
    )
    .bind(institutionId)
    .all();

  return (results || []).map((row) => normalizeStudentRow(row));
};

const fetchStudentsByTeacherRaw = async (db, institutionId, teacherId, maxRows = 100) => {
  const safeLimit = Math.min(Math.max(toNumber(maxRows, 100), 1), 500);
  const { results } = await db
    .prepare(
      `SELECT s.id, s.name, s.grade, s.weakness_points, s.renewal_risk,
              g.id AS parent_id,
              g.name AS parent_name,
              g.phone_encrypted AS parent_phone_encrypted,
              g.wechat_encrypted AS parent_wechat_encrypted,
              g.source AS parent_source,
              COALESCE(
                (SELECT remaining_hours FROM lesson_accounts a WHERE a.student_id = s.id ORDER BY a.created_at DESC LIMIT 1),
                0
              ) AS hours_left,
              s.teacher_id
       FROM students s
       LEFT JOIN guardians g ON g.id = s.guardian_id
       WHERE s.institution_id = ?1 AND (s.teacher_id = ?2 OR ?2 IS NULL OR ?2 = '')
       ORDER BY s.created_at DESC
       LIMIT ${safeLimit}`
    )
    .bind(institutionId, teacherId || '')
    .all();

  return (results || []).map((row) => normalizeStudentRow(row));
};

const updateInstitutionStatusRaw = async (
  db,
  institutionId,
  patch = {}
) => {
  const fields = [];
  const values = [institutionId];
  let bindIndex = 2;

  if (patch.plan_code) {
    values.push(patch.plan_code);
    fields.push(`plan_code = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.plan_mode) {
    values.push(patch.plan_mode);
    fields.push(`plan_mode = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.status) {
    values.push(patch.status);
    fields.push(`status = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.student_limit !== undefined && patch.student_limit !== null) {
    values.push(Number(patch.student_limit));
    fields.push(`student_limit = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.teacher_limit !== undefined && patch.teacher_limit !== null) {
    values.push(Number(patch.teacher_limit));
    fields.push(`teacher_limit = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.ai_limit_monthly !== undefined && patch.ai_limit_monthly !== null) {
    values.push(Number(patch.ai_limit_monthly));
    fields.push(`ai_limit_monthly = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.subscription_starts_at) {
    values.push(patch.subscription_starts_at);
    fields.push(`subscription_starts_at = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.subscription_ends_at) {
    values.push(patch.subscription_ends_at);
    fields.push(`subscription_ends_at = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (patch.trial_ends_at) {
    values.push(patch.trial_ends_at);
    fields.push(`trial_ends_at = ?${bindIndex}`);
    bindIndex += 1;
  }

  if (!fields.length) {
    return false;
  }

  const query = `UPDATE institutions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`;

  const prepared = db.prepare(query).bind(...values);
  const row = await prepared.run();
  return row?.meta?.changes >= 0;
};

const insertInstitutionRaw = async (db, payload = {}) => {
  const id = `${payload.id || payload.institutionId || `inst_${Date.now()}`}`.trim();
  const name = `${payload.name || ''}`.trim();
  const planCode = normalizeStatus(payload.plan_code || payload.planCode, 'trial');
  const planMode = normalizeStatus(payload.plan_mode || payload.planMode, 'monthly');
  const status = normalizeStatus(payload.status, planCode === 'trial' ? 'trial' : 'normal');
  const limit = planLimitMap[planCode] || planLimitMap.trial;
  const studentLimit = toNumber(payload.student_limit ?? payload.studentLimit, limit.students);
  const teacherLimit = toNumber(payload.teacher_limit ?? payload.teacherLimit, limit.teachers);
  const aiLimitMonthly = toNumber(payload.ai_limit_monthly ?? payload.aiLimitMonthly, limit.ai);
  const trialEndsAt = `${payload.trial_ends_at || payload.trialEndsAt || ''}`.trim();
  const subscriptionStartsAt = `${payload.subscription_starts_at || payload.subscriptionStartsAt || ''}`.trim();
  const subscriptionEndsAt = `${payload.subscription_ends_at || payload.subscriptionEndsAt || ''}`.trim();

  if (!id || !name) {
    return null;
  }

  await db
    .prepare(
      `INSERT INTO institutions
         (id, name, status, plan_code, plan_mode, student_limit, teacher_limit, ai_limit_monthly, trial_ends_at, subscription_starts_at, subscription_ends_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
    )
    .bind(
      id,
      name,
      status,
      planCode,
      planMode,
      studentLimit,
      teacherLimit,
      aiLimitMonthly,
      trialEndsAt || null,
      subscriptionStartsAt || null,
      subscriptionEndsAt || null
    )
    .run();

  return {
    id,
    name,
    status,
    planCode,
    planMode,
    studentLimit,
    teacherLimit,
    aiLimitMonthly,
    trialEndsAt,
    subscriptionStartsAt,
    subscriptionEndsAt
  };
};

const fetchStudentByIdRaw = async (db, institutionId, studentId) => {
  const row = await db
    .prepare(
      `SELECT s.id, s.name, s.grade, s.weakness_points, s.renewal_risk,
              g.id AS parent_id,
              g.name AS parent_name,
              g.phone_encrypted AS parent_phone_encrypted,
              g.wechat_encrypted AS parent_wechat_encrypted,
              g.source AS parent_source,
              COALESCE(
                (SELECT remaining_hours FROM lesson_accounts a WHERE a.student_id = s.id ORDER BY a.created_at DESC LIMIT 1),
                0
              ) AS hours_left,
              s.teacher_id
       FROM students s
       LEFT JOIN guardians g ON g.id = s.guardian_id
       WHERE s.id = ?2 AND (?1 IS NULL OR s.institution_id = ?1)
       LIMIT 1`
    )
    .bind(institutionId || null, studentId)
    .first();

  return row ? normalizeStudentRow(row) : null;
};

const buildListWindow = (limit, offset, maxLimit = 200) => {
  const safeLimit = Math.min(Math.max(Math.round(toNumber(limit, 50)), 1), maxLimit);
  const safeOffset = Math.max(Math.round(toNumber(offset, 0)), 0);
  return { safeLimit, safeOffset };
};

const fetchTeachersByInstitutionRaw = async (db, institutionId, filters = {}) => {
  const { safeLimit, safeOffset } = buildListWindow(filters.limit, filters.offset, 200);
  const status = `${filters.status || ''}`.trim();
  const q = `${filters.q || ''}`.trim();
  const where = ['u.institution_id = ?1'];
  const values = [institutionId];

  if (status) {
    values.push(status);
    where.push(`u.status = ?${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    values.push(`%${q}%`);
    where.push(`(u.name LIKE ?${values.length - 1} OR u.username LIKE ?${values.length})`);
  }

  const whereClause = where.join(' AND ');
  const query = `
    SELECT u.id, u.institution_id, u.username, u.role, u.name, u.phone, u.email, u.status, u.created_at
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ?${values.length + 1}
    OFFSET ?${values.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(1) AS total
    FROM users u
    WHERE ${whereClause}
  `;

  const { results } = await db.prepare(query).bind(...values, safeLimit, safeOffset).all();
  const countResult = await db.prepare(countQuery).bind(...values).first();

  return {
    total: toNumber(countResult?.total, 0),
    limit: safeLimit,
    offset: safeOffset,
    nextOffset: safeOffset + safeLimit,
    items: (results || []).map(normalizeTeacherRow)
  };
};

const fetchUserByIdRaw = async (db, userId, institutionId = null) => {
  const row = await db
    .prepare(`
      SELECT *
      FROM users
      WHERE id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}
      LIMIT 1
    `)
    .bind(...(institutionId ? [userId, institutionId] : [userId]))
    .first();

  return row ? normalizeTeacherRow(row) : null;
};

const insertStudentRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const name = `${payload.name || ''}`.trim();
  const grade = `${payload.grade || ''}`.trim();

  if (!institutionId || !name || !grade) {
    return null;
  }

  const studentId = `${payload.id || `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const guardianId = `${payload.guardianId || `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const teacherId = `${payload.teacherId || ''}`.trim() || null;

  const guardianName = `${payload.guardianName || '家长'}`.trim();
  const guardianPhoneEncrypted = `${payload.guardianPhone || 'aes:placeholder:phone'}`.trim();
  const guardianWechatEncrypted = `${payload.guardianWechat || 'aes:placeholder:wechat'}`.trim();

  const initialCoursePayload = {
    institution_id: institutionId,
    id: guardianId,
    name: guardianName || '家长',
    phone_encrypted: guardianPhoneEncrypted,
    wechat_encrypted: guardianWechatEncrypted,
    source: 'api'
  };

  const guardianExists = await db
    .prepare('SELECT id FROM guardians WHERE id = ?1 LIMIT 1')
    .bind(guardianId)
    .first();

  if (!guardianExists) {
    await db
      .prepare(
        `INSERT INTO guardians (id, institution_id, name, phone_encrypted, wechat_encrypted, source)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(
        initialCoursePayload.id,
        initialCoursePayload.institution_id,
        initialCoursePayload.name,
        initialCoursePayload.phone_encrypted,
        initialCoursePayload.wechat_encrypted,
        initialCoursePayload.source
      )
      .run();
  }

  const studentPayload = {
    id: studentId,
    institutionId,
    grade,
    name,
    teacherId,
    weaknessPoints: `${payload.weaknessPoints || ''}`.trim(),
    renewalRisk: Number(payload.renewalRisk || 0)
  };

  await db
    .prepare(
      `INSERT INTO students (id, institution_id, guardian_id, teacher_id, name, grade, weakness_points, renewal_risk)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    )
    .bind(
      studentPayload.id,
      studentPayload.institutionId,
      guardianId,
      studentPayload.teacherId,
      studentPayload.name,
      studentPayload.grade,
      studentPayload.weaknessPoints,
      Number.isFinite(Number(studentPayload.renewalRisk))
        ? Math.max(0, Math.round(Number(studentPayload.renewalRisk)))
        : 0
    )
    .run();

  return { id: studentPayload.id };
};

const updateStudentRaw = async (db, institutionId, studentId, payload = {}) => {
  const fields = [];
  const values = [studentId, institutionId];
  let idx = 3;

  if (payload.name !== undefined) {
    values.push(`${payload.name || ''}`.trim());
    fields.push(`name = ?${idx}`);
    idx += 1;
  }

  if (payload.grade !== undefined) {
    values.push(`${payload.grade || ''}`.trim());
    fields.push(`grade = ?${idx}`);
    idx += 1;
  }

  if (payload.teacherId !== undefined) {
    const value = `${payload.teacherId || ''}`.trim() || null;
    values.push(value);
    fields.push(`teacher_id = ?${idx}`);
    idx += 1;
  }

  if (payload.weaknessPoints !== undefined) {
    values.push(`${payload.weaknessPoints || ''}`.trim());
    fields.push(`weakness_points = ?${idx}`);
    idx += 1;
  }

  if (payload.renewalRisk !== undefined) {
    values.push(Math.max(0, Math.round(Number(payload.renewalRisk || 0))));
    fields.push(`renewal_risk = ?${idx}`);
    idx += 1;
  }

  if (!fields.length) {
    return false;
  }

  const updateSql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`;
  const row = await db.prepare(updateSql).bind(...values).run();
  return row?.meta?.changes > 0;
};

const updateStudentTeacherRaw = async (db, institutionId, studentId, teacherId) => {
  const row = await db
    .prepare(
      'UPDATE students SET teacher_id = ?1 WHERE id = ?2 AND institution_id = ?3'
    )
    .bind(teacherId || null, studentId, institutionId)
    .run();

  return row?.meta?.changes > 0;
};

const fetchLessonsRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  if (!institutionId) {
    return { items: [], total: 0, limit: 0, offset: 0, nextOffset: 0 };
  }

  const { safeLimit, safeOffset } = buildListWindow(filters.limit, filters.offset, 200);
  const status = `${filters.status || ''}`.trim();
  const studentId = `${filters.studentId || ''}`.trim();
  const teacherId = `${filters.teacherId || ''}`.trim();

  const where = ['l.institution_id = ?1'];
  const values = [institutionId];

  if (status) {
    values.push(status);
    where.push(`l.status = ?${values.length}`);
  }
  if (studentId) {
    values.push(studentId);
    where.push(`l.student_id = ?${values.length}`);
  }
  if (teacherId) {
    values.push(teacherId);
    where.push(`l.teacher_id = ?${values.length}`);
  }

  const clause = where.join(' AND ');
  const query = `
    SELECT l.id, l.institution_id, l.student_id, l.teacher_id, l.topic, l.status, l.hours_used,
           l.teacher_note, l.parent_feedback, l.created_at,
           s.name AS student_name,
           s.grade AS student_grade,
           u.name AS teacher_name
    FROM lessons l
    JOIN students s ON s.id = l.student_id
    LEFT JOIN users u ON u.id = l.teacher_id
    WHERE ${clause}
    ORDER BY l.created_at DESC
    LIMIT ?${values.length + 1}
    OFFSET ?${values.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(1) AS total
    FROM lessons l
    WHERE ${clause}
  `;

  const { results } = await db.prepare(query).bind(...values, safeLimit, safeOffset).all();
  const countResult = await db.prepare(countQuery).bind(...values).first();

  return {
    items: (results || []).map(normalizeLessonRow),
    total: toNumber(countResult?.total, 0),
    limit: safeLimit,
    offset: safeOffset,
    nextOffset: safeOffset + safeLimit
  };
};

const fetchLessonByIdRaw = async (db, lessonId, institutionId = '') => {
  const row = await db
    .prepare(
      `SELECT l.id, l.institution_id, l.student_id, l.teacher_id, l.topic, l.status, l.hours_used,
              l.teacher_note, l.parent_feedback, l.created_at,
              s.name AS student_name,
              s.grade AS student_grade,
              u.name AS teacher_name
       FROM lessons l
       JOIN students s ON s.id = l.student_id
       LEFT JOIN users u ON u.id = l.teacher_id
       WHERE l.id = ?1 ${institutionId ? 'AND l.institution_id = ?2' : ''}
       LIMIT 1`
    )
    .bind(...(institutionId ? [lessonId, institutionId] : [lessonId]))
    .first();

  return row ? normalizeLessonRow(row) : null;
};

const fetchLatestLessonAccountByStudentRaw = async (db, studentId) => {
  return await db
    .prepare(
      `SELECT id, student_id, remaining_hours
       FROM lesson_accounts
       WHERE student_id = ?1
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(studentId)
    .first();
};

const insertLessonRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const studentId = `${payload.studentId || ''}`.trim();
  const teacherId = `${payload.teacherId || ''}`.trim();
  const topic = `${payload.topic || '课程'}`.trim();
  const status = `${payload.status || 'completed'}`.trim();
  const teacherNote = `${payload.teacherNote || ''}`.trim();
  const parentFeedback = `${payload.parentFeedback || ''}`.trim();
  const hoursUsed = Math.max(1, Math.round(Number(payload.hoursUsed || 1)));

  if (!institutionId || !studentId || !teacherId) {
    return null;
  }

  const id = `${payload.id || `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;

  await db
    .prepare(
      `INSERT INTO lessons (id, institution_id, student_id, teacher_id, topic, status, hours_used, teacher_note, parent_feedback)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(
      id,
      institutionId,
      studentId,
      teacherId,
      topic,
      status,
      hoursUsed,
      teacherNote,
      parentFeedback
    )
    .run();

  return {
    id,
    institutionId,
    studentId,
    teacherId,
    topic,
    status,
    hoursUsed,
    teacherNote,
    parentFeedback
  };
};

const updateLessonRaw = async (db, lessonId, institutionId, payload = {}) => {
  const fields = [];
  const values = [lessonId, institutionId];
  let idx = 3;

  if (payload.status !== undefined) {
    values.push(`${payload.status || ''}`.trim());
    fields.push(`status = ?${idx}`);
    idx += 1;
  }

  if (payload.teacherNote !== undefined) {
    values.push(`${payload.teacherNote || ''}`.trim());
    fields.push(`teacher_note = ?${idx}`);
    idx += 1;
  }

  if (payload.parentFeedback !== undefined) {
    values.push(`${payload.parentFeedback || ''}`.trim());
    fields.push(`parent_feedback = ?${idx}`);
    idx += 1;
  }

  if (!fields.length) {
    return false;
  }

  const row = await db
    .prepare(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`)
    .bind(...values)
    .run();

  return row?.meta?.changes > 0;
};

const consumeLessonAccountRaw = async (db, studentId, accountId, hoursUsed) => {
  const safeHours = Math.max(1, Math.round(Number(hoursUsed || 1)));
  const updated = await db
    .prepare(
      `UPDATE lesson_accounts
       SET remaining_hours = remaining_hours - ?2
       WHERE id = ?1 AND remaining_hours >= ?2`
    )
    .bind(accountId, safeHours)
    .run();

  if (!updated || updated.meta?.changes <= 0) {
    return null;
  }

  return safeHours;
};

const ensureLessonAccountEnoughRaw = async (db, studentId, hoursUsed) => {
  const account = await fetchLatestLessonAccountByStudentRaw(db, studentId);
  if (!account) {
    return { ok: false, reason: 'NO_LESSON_ACCOUNT' };
  }

  if (toNumber(account.remaining_hours, 0) < Math.max(1, Math.round(Number(hoursUsed || 1)))) {
    return { ok: false, reason: 'INSUFFICIENT_HOURS' };
  }

  return { ok: true, account };
};

const fetchLeadsByInstitutionRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  if (!institutionId) {
    return { items: [], total: 0, limit: 0, offset: 0, nextOffset: 0 };
  }

  const { safeLimit, safeOffset } = buildListWindow(filters.limit, filters.offset, 200);
  const status = `${filters.status || ''}`.trim();
  const q = `${filters.q || ''}`.trim();
  const where = ['l.institution_id = ?1'];
  const values = [institutionId];

  if (status) {
    values.push(status);
    where.push(`l.status = ?${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);
    values.push(`%${q}%`);
    where.push(`(l.guardian_name LIKE ?${values.length - 1} OR l.need_summary LIKE ?${values.length})`);
  }

  const clause = where.join(' AND ');
  const query = `SELECT * FROM leads l WHERE ${clause} ORDER BY l.created_at DESC LIMIT ?${values.length + 1} OFFSET ?${values.length + 2}`;
  const countQuery = `SELECT COUNT(1) AS total FROM leads l WHERE ${clause}`;

  const { results } = await db.prepare(query).bind(...values, safeLimit, safeOffset).all();
  const countResult = await db.prepare(countQuery).bind(...values).first();

  return {
    items: (results || []).map(normalizeLeadRow),
    total: toNumber(countResult?.total, 0),
    limit: safeLimit,
    offset: safeOffset,
    nextOffset: safeOffset + safeLimit
  };
};

const insertLeadRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const guardianName = `${payload.guardianName || ''}`.trim();
  if (!institutionId || !guardianName) {
    return null;
  }

  const id = `${payload.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const status = `${payload.status || 'new'}`.trim();
  const studentGrade = `${payload.studentGrade || ''}`.trim();
  const needSummary = `${payload.needSummary || ''}`.trim();
  const aiRecommendation = `${payload.aiRecommendation || ''}`.trim();

  await db
    .prepare(
      `INSERT INTO leads (id, institution_id, guardian_name, student_grade, need_summary, status, ai_recommendation)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(id, institutionId, guardianName, studentGrade, needSummary, status, aiRecommendation)
    .run();

  return { id, institutionId, guardianName, studentGrade, needSummary, status, aiRecommendation };
};

const updateLeadRaw = async (db, leadId, institutionId, payload = {}) => {
  const fields = [];
  const values = [leadId, institutionId];
  let idx = 3;

  if (payload.status !== undefined) {
    values.push(`${payload.status || ''}`.trim());
    fields.push(`status = ?${idx}`);
    idx += 1;
  }

  if (payload.studentGrade !== undefined) {
    values.push(`${payload.studentGrade || ''}`.trim());
    fields.push(`student_grade = ?${idx}`);
    idx += 1;
  }

  if (payload.needSummary !== undefined) {
    values.push(`${payload.needSummary || ''}`.trim());
    fields.push(`need_summary = ?${idx}`);
    idx += 1;
  }

  if (payload.aiRecommendation !== undefined) {
    values.push(`${payload.aiRecommendation || ''}`.trim());
    fields.push(`ai_recommendation = ?${idx}`);
    idx += 1;
  }

  if (!fields.length) {
    return false;
  }

  const row = await db
    .prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`)
    .bind(...values)
    .run();

  return row?.meta?.changes > 0;
};

const fetchPaymentsByInstitutionRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  if (!institutionId) {
    return { items: [], total: 0, limit: 0, offset: 0, nextOffset: 0 };
  }

  const { safeLimit, safeOffset } = buildListWindow(filters.limit, filters.offset, 200);
  const status = `${filters.status || ''}`.trim();
  const planCode = `${filters.planCode || ''}`.trim();
  const where = ['institution_id = ?1'];
  const values = [institutionId];

  if (status) {
    values.push(status);
    where.push(`status = ?${values.length}`);
  }

  if (planCode) {
    values.push(planCode);
    where.push(`plan_code = ?${values.length}`);
  }

  const clause = where.join(' AND ');
  const query = `
    SELECT * FROM payments
    WHERE ${clause}
    ORDER BY created_at DESC
    LIMIT ?${values.length + 1}
    OFFSET ?${values.length + 2}
  `;
  const countQuery = `SELECT COUNT(1) AS total FROM payments WHERE ${clause}`;

  const { results } = await db.prepare(query).bind(...values, safeLimit, safeOffset).all();
  const countResult = await db.prepare(countQuery).bind(...values).first();

  return {
    items: (results || []).map(normalizePaymentRow),
    total: toNumber(countResult?.total, 0),
    limit: safeLimit,
    offset: safeOffset,
    nextOffset: safeOffset + safeLimit
  };
};

const fetchPaymentByIdRaw = async (db, paymentId, institutionId = '') => {
  const row = await db
    .prepare(
      `SELECT * FROM payments
       WHERE id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}
       LIMIT 1`
    )
    .bind(...(institutionId ? [paymentId, institutionId] : [paymentId]))
    .first();

  return row ? normalizePaymentRow(row) : null;
};

const insertPaymentRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const orderNo = `${payload.orderNo || ''}`.trim();
  const planCode = `${payload.planCode || 'trial'}`.trim();
  const planMode = `${payload.planMode || 'monthly'}`.trim();
  const userId = payload.userId || null;
  const amountCents = Math.max(0, Math.round(Number(payload.amountCents || 0)));
  const periodDays = Math.max(1, Math.round(Number(payload.periodDays || 30)));
  const status = `${payload.status || 'pending'}`.trim();

  if (!institutionId || !orderNo || !amountCents) {
    return null;
  }

  const id = `${payload.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  await db
    .prepare(
      `INSERT INTO payments (id, institution_id, user_id, order_no, amount_cents, currency, plan_code, plan_mode, period_days, status)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    )
    .bind(id, institutionId, userId, orderNo, amountCents, `${payload.currency || 'CNY'}`.trim(), planCode, planMode, periodDays, status)
    .run();

  return { id, institutionId, orderNo, amountCents, planCode, planMode, periodDays, status };
};

const updatePaymentRaw = async (db, paymentId, institutionId, payload = {}) => {
  const fields = [];
  const values = [paymentId, institutionId];
  let idx = 3;

  if (payload.status !== undefined) {
    values.push(`${payload.status || ''}`.trim());
    fields.push(`status = ?${idx}`);
    idx += 1;
  }

  if (payload.paidAt !== undefined) {
    values.push(`${payload.paidAt || ''}`.trim());
    fields.push(`paid_at = ?${idx}`);
    idx += 1;
  }

  if (payload.startsAt !== undefined) {
    values.push(`${payload.startsAt || ''}`.trim());
    fields.push(`starts_at = ?${idx}`);
    idx += 1;
  }

  if (payload.expiresAt !== undefined) {
    values.push(`${payload.expiresAt || ''}`.trim());
    fields.push(`expires_at = ?${idx}`);
    idx += 1;
  }

  if (!fields.length) {
    return false;
  }

  const row = await db
    .prepare(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`)
    .bind(...values)
    .run();

  return row?.meta?.changes > 0;
};

const fetchPermissionsByInstitutionRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  if (!institutionId) {
    return [];
  }

  const userId = `${filters.userId || ''}`.trim();
  const where = ['u.institution_id = ?1'];
  const values = [institutionId];

  if (userId) {
    values.push(userId);
    where.push(`up.user_id = ?${values.length}`);
  }

  const clause = where.join(' AND ');
  const query = `
    SELECT up.id, up.permission_code, up.user_id, up.created_at,
           u.name AS user_name,
           u.username,
           u.role AS user_role,
           u.institution_id
    FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE ${clause}
    ORDER BY up.created_at DESC
  `;

  const { results } = await db.prepare(query).bind(...values).all();
  return (results || []).map(normalizePermissionRow);
};

const grantPermissionRaw = async (db, payload = {}) => {
  const userId = `${payload.userId || ''}`.trim();
  const permissionCode = `${payload.permissionCode || ''}`.trim();
  if (!userId || !permissionCode) {
    return false;
  }

  const id = `${payload.id || `perm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const row = await db
    .prepare(`INSERT OR IGNORE INTO user_permissions (id, user_id, permission_code) VALUES (?1, ?2, ?3)`)
    .bind(id, userId, permissionCode)
    .run();

  return row?.meta?.changes >= 0;
};

const revokePermissionRaw = async (db, payload = {}) => {
  const userId = `${payload.userId || ''}`.trim();
  const permissionCode = `${payload.permissionCode || ''}`.trim();
  if (!userId || !permissionCode) {
    return false;
  }

  const row = await db
    .prepare(`DELETE FROM user_permissions WHERE user_id = ?1 AND permission_code = ?2`)
    .bind(userId, permissionCode)
    .run();

  return row?.meta?.changes >= 0;
};

const fetchCultureWallAssetsByInstitutionRaw = async (db, institutionId, kind = '') => {
  const safeKind = `${kind || ''}`.trim();
  const bindValues = [institutionId];
  const conditions = [];

  if (safeKind) {
    conditions.push(`kind = ?${bindValues.length + 1}`);
    bindValues.push(safeKind);
  }

  const query = `
    SELECT *
    FROM culture_wall_assets
    WHERE institution_id = ?1
    ${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
    ORDER BY created_at DESC
  `;

  const { results } = await db.prepare(query).bind(...bindValues).all();
  return normalizeCultureWallRows(results || []);
};

const insertCultureWallAssetRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  if (!institutionId) {
    return null;
  }

  const id = `${payload.id || `cw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const kind = `${payload.kind || ''}`.trim();
  const title = `${payload.title || ''}`.trim();
  const description = `${payload.description || ''}`.trim();
  const uploader = `${payload.uploader || '机构管理员'}`.trim();

  const query = `
    INSERT INTO culture_wall_assets (
      id,
      institution_id,
      kind,
      title,
      description,
      uploader,
      media_key,
      media_url,
      cover_url,
      duration,
      status,
      payload
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
  `;

  const prepared = db
    .prepare(query)
    .bind(
      id,
      institutionId,
      kind,
      title,
      description,
      uploader,
      `${payload.mediaKey || ''}`,
      `${payload.mediaUrl || ''}`,
      `${payload.coverUrl || ''}`,
      `${payload.duration || ''}`,
      `${payload.status || '已发布'}`,
      `${JSON.stringify(payload.extra || {})}`
    );

  await prepared.run();
  return { id, ...payload };
};

const deleteCultureWallAssetRaw = async (db, institutionId, assetId) => {
  const query = `
    DELETE FROM culture_wall_assets
    WHERE institution_id = ?1 AND id = ?2
  `;
  const row = await db.prepare(query).bind(institutionId, assetId).run();
  return row?.meta?.changes > 0;
};

const fetchCultureWallAssetByIdRaw = async (db, institutionId, assetId) => {
  const row = await db
    .prepare(
      `SELECT id, institution_id, kind, media_key, media_url
       FROM culture_wall_assets
       WHERE institution_id = ?1 AND id = ?2
       LIMIT 1`
    )
    .bind(institutionId, assetId)
    .first();

  return row || null;
};

const resolveUsageWindow = (startAt, endAt) => {
  const safeStart = `${startAt || ''}`.trim();
  const safeEnd = `${endAt || ''}`.trim();

  return {
    startAt: safeStart,
    endAt: safeEnd
  };
};

const fetchAiUsageSummaryRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const window = resolveUsageWindow(filters.startAt, filters.endAt);
  const where = [];
  const values = [];

  const joinConditions = [];
  if (window.startAt) {
    joinConditions.push(`a.created_at >= ?${values.length + 1}`);
    values.push(window.startAt);
  }
  if (window.endAt) {
    joinConditions.push(`a.created_at <= ?${values.length + 1}`);
    values.push(window.endAt);
  }

  if (institutionId) {
    where.push(`i.id = ?${values.length + 1}`);
    values.push(institutionId);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const joinClause = joinConditions.length ? `AND ${joinConditions.join(' AND ')}` : '';

  const query = `
    SELECT
      i.id AS institution_id,
      i.name AS institution_name,
      i.plan_code,
      i.ai_limit_monthly,
      i.ai_used_month,
      COALESCE(SUM(a.tokens_used), 0) AS tokens_used_window,
      COALESCE(COUNT(a.id), 0) AS request_count_window,
      MAX(a.created_at) AS last_used_at
    FROM institutions i
    LEFT JOIN ai_usage a
      ON a.institution_id = i.id ${joinClause}
    ${whereClause}
    GROUP BY
      i.id,
      i.name,
      i.plan_code,
      i.ai_limit_monthly,
      i.ai_used_month
    ORDER BY COALESCE(SUM(a.tokens_used), 0) DESC
  `;

  const { results } = await db.prepare(query).bind(...values).all();
  return Array.isArray(results) ? results.map(normalizeAiUsageSummaryRow) : [];
};

const fetchAiUsageSourceSummaryRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const window = resolveUsageWindow(filters.startAt, filters.endAt);
  const where = ["l.decision IN ('allowed', 'mock-fallback')"];
  const values = [];

  if (window.startAt) {
    values.push(window.startAt);
    where.push(`l.created_at >= ?${values.length}`);
  }
  if (window.endAt) {
    values.push(window.endAt);
    where.push(`l.created_at <= ?${values.length}`);
  }
  if (institutionId) {
    values.push(institutionId);
    where.push(`l.institution_id = ?${values.length}`);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  const query = `
    WITH normalized AS (
      SELECT
        CASE
          WHEN (
            LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%mock%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%模拟%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) IN ('mock', 'mock-fallback', 'mock-fallback-v2', 'mocked', 'simulation')
          ) THEN 'mock'
          WHEN (
            LOWER(TRIM(COALESCE(l.source, ''))) IN ('provider', 'provider-api', 'provider-llm', 'real', 'real-model', 'realapi', 'real-model-api', 'gpt', 'openai', 'azure', 'claude', 'gemini', 'deepseek', 'llama', 'qwen', 'ernie')
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%provider%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%real%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%cloud%'
          ) THEN 'real'
          ELSE 'unknown'
        END AS source_category
      FROM ai_audit_logs l
      ${whereClause}
    )
    SELECT
      COALESCE(SUM(CASE
        WHEN source_category = 'mock' THEN 1 ELSE 0 END), 0) AS mockRequests,
      COALESCE(SUM(CASE
        WHEN source_category = 'real' THEN 1 ELSE 0 END), 0) AS realRequests,
      COALESCE(SUM(CASE
        WHEN source_category = 'unknown' THEN 1 ELSE 0 END), 0) AS unknownRequests,
      COALESCE(COUNT(1), 0) AS totalRequests
    FROM normalized
  `;

  const { results } = await db.prepare(query).bind(...values).all();
  return normalizeAiUsageSourceSummaryRow(results?.[0] || {});
};

const fetchAiUsageTopUsersRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  if (!institutionId) {
    return [];
  }

  const { safeLimit } = buildListWindow(filters.limit, 0, 50);
  const startAt = `${filters.startAt || ''}`.trim();
  const endAt = `${filters.endAt || ''}`.trim();
  const where = [`a.institution_id = ?1`];
  const values = [institutionId];

  if (startAt) {
    values.push(startAt);
    where.push(`a.created_at >= ?${values.length}`);
  }
  if (endAt) {
    values.push(endAt);
    where.push(`a.created_at <= ?${values.length}`);
  }

  const whereClause = where.join(' AND ');
  const query = `
    SELECT
      a.user_id,
      COALESCE(u.name, '匿名用户') AS user_name,
      COALESCE(u.role, '') AS role,
      COALESCE(SUM(a.tokens_used), 0) AS tokens_used,
      COUNT(a.id) AS request_count,
      MAX(a.created_at) AS last_used_at
    FROM ai_usage a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE ${whereClause}
    GROUP BY a.user_id, u.name, u.role
    ORDER BY tokens_used DESC
    LIMIT ?${values.length + 1}
  `;

  const { results } = await db.prepare(query).bind(...values, safeLimit).all();
  return Array.isArray(results) ? results.map(normalizeAiUsageUserRow) : [];
};

const insertAiUsageRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  if (!institutionId) {
    return null;
  }

  const id = `${payload.id || `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const userId = payload.userId ? `${payload.userId}`.trim() : null;
  const agentCode = `${payload.agentCode || ''}`.trim();
  const tokensUsed = Number(payload.tokensUsed || 0);
  const safeTokens = Number.isFinite(tokensUsed) && tokensUsed > 0 ? Math.round(tokensUsed) : 0;

  const query = `
    INSERT INTO ai_usage (
      id,
      institution_id,
      user_id,
      agent_code,
      tokens_used
    )
    VALUES (?1, ?2, ?3, ?4, ?5)
  `;

  const prepared = db
    .prepare(query)
    .bind(
      id,
      institutionId,
      userId,
      agentCode,
      safeTokens
    );

  await prepared.run();
  return { id, institutionId, userId, agentCode, tokensUsed: safeTokens };
};

const insertAiAuditLogRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim() || null;
  const userId = payload.userId ? `${payload.userId}`.trim() : null;
  const role = `${payload.role || 'unknown'}`.trim();
  const action = `${payload.action || ''}`.trim();
  const decision = `${payload.decision || 'error'}`.trim();
  const reason = `${payload.reason || ''}`.trim();
  const source = `${payload.source || 'mock'}`.trim();
  const clientIp = `${payload.clientIp || ''}`.trim();
  const requestId = `${payload.requestId || ''}`.trim();
  const requestPayload = typeof payload.requestPayload === 'string'
    ? payload.requestPayload
    : JSON.stringify(payload.requestPayload || {});
  const latencyMs = Number.isFinite(Number(payload.latencyMs)) ? Math.max(0, Math.round(Number(payload.latencyMs))) : 0;
  const tokensUsed = Number.isFinite(Number(payload.tokensUsed)) ? Math.max(0, Math.round(Number(payload.tokensUsed))) : 0;

  const id = `${payload.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;

  const query = `
    INSERT INTO ai_audit_logs (
      id,
      institution_id,
      user_id,
      role,
      action,
      decision,
      reason,
      source,
      client_ip,
      request_payload,
      latency_ms,
      tokens_used,
      request_id
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
  `;

  await db
    .prepare(query)
    .bind(
      id,
      institutionId,
      userId,
      role,
      action,
      decision,
      reason,
      source,
      clientIp,
      requestPayload,
      latencyMs,
      tokensUsed,
      requestId
    )
    .run();

  return {
    id,
    institutionId,
    userId,
    role,
    action,
    decision,
    reason
  };
};

const normalizeAuditRow = (row = {}) => ({
  id: `${row.id || ''}`,
  institutionId: `${row.institution_id || ''}`,
  institutionName: `${row.institution_name || ''}`,
  userId: `${row.user_id || ''}`,
  role: `${row.role || ''}`,
  action: `${row.action || ''}`,
  decision: `${row.decision || ''}`,
  reason: `${row.reason || ''}`,
  source: `${row.source || ''}`,
  clientIp: `${row.client_ip || ''}`,
  requestPayload: `${row.request_payload || ''}`,
  latencyMs: toNumber(row.latency_ms, 0),
  tokensUsed: toNumber(row.tokens_used, 0),
  requestId: `${row.request_id || ''}`,
  createdAt: `${row.created_at || ''}`
});

const buildLimitOffset = (limit, offset) => {
  const safeLimit = Math.min(Math.max(Math.round(Number(limit) || 50), 1), 200);
  const safeOffset = Math.max(Math.round(Number(offset) || 0), 0);
  return { safeLimit, safeOffset };
};

const fetchAiAuditLogsRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const action = `${filters.action || ''}`.trim();
  const decision = `${filters.decision || ''}`.trim();
  const role = `${filters.role || ''}`.trim();
  const userId = `${filters.userId || ''}`.trim();
  const clientIp = `${filters.clientIp || ''}`.trim();
  const startAt = `${filters.startAt || ''}`.trim();
  const endAt = `${filters.endAt || ''}`.trim();
  const { safeLimit, safeOffset } = buildLimitOffset(filters.limit, filters.offset);

  const where = [];
  const values = [];

  if (institutionId) {
    values.push(institutionId);
    where.push(`l.institution_id = ?${values.length}`);
  }

  if (action) {
    values.push(action);
    where.push(`l.action = ?${values.length}`);
  }

  if (decision) {
    values.push(decision);
    where.push(`l.decision = ?${values.length}`);
  }

  if (role) {
    values.push(role);
    where.push(`l.role = ?${values.length}`);
  }

  if (userId) {
    values.push(userId);
    where.push(`l.user_id = ?${values.length}`);
  }

  if (clientIp) {
    values.push(clientIp);
    where.push(`l.client_ip = ?${values.length}`);
  }

  if (startAt) {
    values.push(startAt);
    where.push(`l.created_at >= ?${values.length}`);
  }

  if (endAt) {
    values.push(endAt);
    where.push(`l.created_at <= ?${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const whereValues = [...values];

  const listQuery = `
    SELECT
      l.*,
      i.name AS institution_name
    FROM ai_audit_logs l
    LEFT JOIN institutions i ON i.id = l.institution_id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT ?${whereValues.length + 1}
    OFFSET ?${whereValues.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(1) AS total
    FROM ai_audit_logs l
    ${whereClause}
  `;

  const { results, meta } = await db
    .prepare(listQuery)
    .bind(...whereValues, safeLimit, safeOffset)
    .all();

  const countResult = await db
    .prepare(countQuery)
    .bind(...whereValues)
    .first();

  const total = Number(countResult?.total || 0);
  const audits = Array.isArray(results) ? results.map(normalizeAuditRow) : [];
  const nextOffset = safeOffset + safeLimit;

  return {
    total,
    limit: safeLimit,
    offset: safeOffset,
    nextOffset: nextOffset < total ? nextOffset : total,
    items: audits
  };
};

const fetchAiAuditSourceSummaryRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const action = `${filters.action || ''}`.trim();
  const decision = `${filters.decision || ''}`.trim();
  const role = `${filters.role || ''}`.trim();
  const userId = `${filters.userId || ''}`.trim();
  const clientIp = `${filters.clientIp || ''}`.trim();
  const startAt = `${filters.startAt || ''}`.trim();
  const endAt = `${filters.endAt || ''}`.trim();

  const where = [];
  const values = [];

  if (institutionId) {
    values.push(institutionId);
    where.push(`l.institution_id = ?${values.length}`);
  }
  if (action) {
    values.push(action);
    where.push(`l.action = ?${values.length}`);
  }
  if (decision) {
    values.push(decision);
    where.push(`l.decision = ?${values.length}`);
  }
  if (role) {
    values.push(role);
    where.push(`l.role = ?${values.length}`);
  }
  if (userId) {
    values.push(userId);
    where.push(`l.user_id = ?${values.length}`);
  }
  if (clientIp) {
    values.push(clientIp);
    where.push(`l.client_ip = ?${values.length}`);
  }
  if (startAt) {
    values.push(startAt);
    where.push(`l.created_at >= ?${values.length}`);
  }
  if (endAt) {
    values.push(endAt);
    where.push(`l.created_at <= ?${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    WITH normalized AS (
      SELECT
        CASE
          WHEN (
            LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%mock%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%模拟%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) IN ('mock', 'mock-fallback', 'mock-fallback-v2', 'mocked', 'simulation')
          ) THEN 'mock'
          WHEN (
            LOWER(TRIM(COALESCE(l.source, ''))) IN ('provider', 'provider-api', 'provider-llm', 'real', 'real-model', 'realapi', 'real-model-api', 'gpt', 'openai', 'azure', 'claude', 'gemini', 'deepseek', 'llama', 'qwen', 'ernie')
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%provider%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%real%'
            OR LOWER(TRIM(COALESCE(l.source, ''))) LIKE '%cloud%'
          ) THEN 'real'
          ELSE 'unknown'
        END AS source_category
      FROM ai_audit_logs l
      ${whereClause}
    )
    SELECT
      COALESCE(SUM(CASE WHEN source_category = 'mock' THEN 1 ELSE 0 END), 0) AS mockRequests,
      COALESCE(SUM(CASE WHEN source_category = 'real' THEN 1 ELSE 0 END), 0) AS realRequests,
      COALESCE(SUM(CASE WHEN source_category = 'unknown' THEN 1 ELSE 0 END), 0) AS unknownRequests,
      COALESCE(COUNT(1), 0) AS totalRequests
    FROM normalized
  `;

  const { results } = await db.prepare(query).bind(...values).all();
  return normalizeAiAuditSourceSummaryRow(results?.[0] || {});
};

const increaseInstitutionAiUsageRaw = async (db, institutionId, delta = 0) => {
  const safeInstitutionId = `${institutionId || ''}`.trim();
  const safeDelta = Number.isFinite(Number(delta)) ? Math.max(1, Math.round(Number(delta))) : 1;
  if (!safeInstitutionId) {
    return false;
  }

  const query = `
    UPDATE institutions
    SET ai_used_month = COALESCE(ai_used_month, 0) + ?2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?1
  `;
  const row = await db.prepare(query).bind(safeInstitutionId, safeDelta).run();
  return row?.meta?.changes > 0;
};

const fetchCoursesRaw = async (db, filters = {}) => {
  const limit = Math.min(Math.max(Math.round(Number(filters.limit || 50)), 1), 200);
  const offset = Math.max(Math.round(Number(filters.offset || 0)), 0);
  const institutionId = `${filters.institutionId || ''}`.trim();
  const grade = `${filters.grade || ''}`.trim();
  const status = `${filters.status || 'active'}`.trim();
  const classType = `${filters.classType || ''}`.trim();

  const where = [];
  const values = [];
  let paramIndex = 1;

  if (institutionId) {
    values.push(institutionId);
    where.push(`c.institution_id = ?${paramIndex}`);
    paramIndex += 1;
  }

  if (status) {
    where.push(`c.status = ?${paramIndex}`);
    values.push(status);
    paramIndex += 1;
  }

  if (grade) {
    where.push(`c.grade = ?${paramIndex}`);
    values.push(grade);
    paramIndex += 1;
  }

  if (classType) {
    where.push(`c.class_type = ?${paramIndex}`);
    values.push(classType);
    paramIndex += 1;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const query = `
    SELECT
      c.id, c.institution_id, c.teacher_id, c.name, c.grade, c.level, c.class_type,
      c.schedule, c.start_time, c.duration_minutes, c.capacity,
      c.price_cents, c.currency, c.status, c.image_url, c.created_at
    FROM courses c
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ?${paramIndex}
    OFFSET ?${paramIndex + 1}
  `;

  const countQuery = `
    SELECT COUNT(1) AS total FROM courses c ${whereClause}
  `;

  const listRows = await db
    .prepare(query)
    .bind(...values, limit, offset)
    .all();

  const totalRow = await db.prepare(countQuery).bind(...values).first();

  return {
    total: toNumber(totalRow?.total, 0),
    limit,
    offset,
    nextOffset: offset + limit,
    items: (listRows.results || []).map(normalizeCourseRow)
  };
};

const fetchCourseByIdRaw = async (db, courseId, institutionId = '') => {
  const row = await db
    .prepare(
      `SELECT
        id, institution_id, teacher_id, name, grade, level, class_type,
        schedule, start_time, duration_minutes, capacity,
        price_cents, currency, status, image_url, created_at
       FROM courses
       WHERE id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}
       LIMIT 1`
    )
    .bind(...(institutionId ? [courseId, institutionId] : [courseId]))
    .first();

  return row ? normalizeCourseRow(row) : null;
};

const fetchCoursesByTeacherRaw = async (db, teacherId, institutionId = '') => {
  const list = await db
    .prepare(
      `SELECT
        id, institution_id, teacher_id, name, grade, level, class_type,
        schedule, start_time, duration_minutes, capacity,
        price_cents, currency, status, image_url, created_at
       FROM courses
       WHERE teacher_id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}
       ORDER BY created_at DESC`
    )
    .bind(...(institutionId ? [teacherId, institutionId] : [teacherId]))
    .all();

  return (list.results || []).map(normalizeCourseRow);
};

const insertCourseRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const name = `${payload.name || ''}`.trim();
  if (!institutionId || !name) {
    return null;
  }

  const id = `${payload.id || `course-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const teacherId = `${payload.teacherId || ''}`.trim();
  const grade = `${payload.grade || ''}`.trim();
  const level = `${payload.level || ''}`.trim();
  const classType = `${payload.classType || 'small'}`.trim();
  const schedule = `${payload.schedule || ''}`.trim();
  const startTime = `${payload.startTime || ''}`.trim();
  const durationMinutes = Math.max(0, Math.round(Number(payload.durationMinutes || 90)));
  const capacity = Math.max(1, Math.round(Number(payload.capacity || 12)));
  const priceCents = Math.max(0, Math.round(Number(payload.priceCents || 0)));
  const currency = `${payload.currency || 'CNY'}`.trim();
  const status = `${payload.status || 'active'}`.trim();
  const imageUrl = `${payload.imageUrl || ''}`.trim();

  await db
    .prepare(
      `INSERT INTO courses
       (id, institution_id, teacher_id, name, grade, level, class_type, schedule, start_time,
        duration_minutes, capacity, price_cents, currency, status, image_url)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
    )
    .bind(
      id,
      institutionId,
      teacherId || null,
      name,
      grade,
      level,
      classType,
      schedule,
      startTime,
      durationMinutes,
      capacity,
      priceCents,
      currency,
      status,
      imageUrl
    )
    .run();

  return { id, institutionId, name, grade, level, classType, schedule, startTime };
};

const updateCourseRaw = async (db, courseId, institutionId, payload = {}) => {
  const fields = [];
  const values = [courseId, institutionId];
  let idx = 3;

  if (payload.teacherId !== undefined) {
    values.push(`${payload.teacherId || ''}`.trim() || null);
    fields.push(`teacher_id = ?${idx}`);
    idx += 1;
  }
  if (payload.name !== undefined) {
    values.push(`${payload.name || ''}`.trim());
    fields.push(`name = ?${idx}`);
    idx += 1;
  }
  if (payload.grade !== undefined) {
    values.push(`${payload.grade || ''}`.trim());
    fields.push(`grade = ?${idx}`);
    idx += 1;
  }
  if (payload.level !== undefined) {
    values.push(`${payload.level || ''}`.trim());
    fields.push(`level = ?${idx}`);
    idx += 1;
  }
  if (payload.classType !== undefined) {
    values.push(`${payload.classType || ''}`.trim());
    fields.push(`class_type = ?${idx}`);
    idx += 1;
  }
  if (payload.status !== undefined) {
    values.push(`${payload.status || ''}`.trim());
    fields.push(`status = ?${idx}`);
    idx += 1;
  }
  if (payload.schedule !== undefined) {
    values.push(`${payload.schedule || ''}`.trim());
    fields.push(`schedule = ?${idx}`);
    idx += 1;
  }
  if (payload.startTime !== undefined) {
    values.push(`${payload.startTime || ''}`.trim());
    fields.push(`start_time = ?${idx}`);
    idx += 1;
  }
  if (payload.priceCents !== undefined) {
    values.push(Math.max(0, Math.round(Number(payload.priceCents || 0))));
    fields.push(`price_cents = ?${idx}`);
    idx += 1;
  }
  if (payload.capacity !== undefined) {
    values.push(Math.max(1, Math.round(Number(payload.capacity || 0))));
    fields.push(`capacity = ?${idx}`);
    idx += 1;
  }

  if (!fields.length) {
    return false;
  }

  const row = await db
    .prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?1 AND institution_id = ?2`)
    .bind(...values)
    .run();

  return row?.meta?.changes > 0;
};

const fetchStudentCoursesRaw = async (db, studentId, institutionId = '') => {
  const row = await db
    .prepare(
      `SELECT c.id, c.institution_id, c.teacher_id, c.name, c.grade, c.level, c.class_type,
              c.schedule, c.start_time, c.duration_minutes, c.capacity, c.price_cents, c.currency,
              ce.enrollment_status AS enrollment_status, ce.created_at AS enrolled_at
         FROM course_enrollments ce
         JOIN courses c ON c.id = ce.course_id
        WHERE ce.student_id = ?1 ${institutionId ? 'AND ce.institution_id = ?2' : ''}
        ORDER BY ce.created_at DESC`
    )
    .bind(...(institutionId ? [studentId, institutionId] : [studentId]))
    .all();

  return (row.results || []).map((item) => ({
    ...normalizeCourseRow(item),
    enrollmentStatus: item.enrollment_status || 'active'
  }));
};

const fetchCourseEnrollmentsRaw = async (db, courseId) => {
  const row = await db
    .prepare(
      `SELECT id, institution_id, course_id, student_id, enrollment_status, source, created_at
       FROM course_enrollments
       WHERE course_id = ?1
       ORDER BY created_at DESC`
    )
    .bind(courseId)
    .all();

  return (row.results || []).map(normalizeEnrollmentRow);
};

const upsertCourseEnrollmentRaw = async (db, payload = {}) => {
  const courseId = `${payload.courseId || ''}`.trim();
  const studentId = `${payload.studentId || ''}`.trim();
  if (!courseId || !studentId) {
    return null;
  }

  const institutionId = `${payload.institutionId || ''}`.trim();
  const id = `${payload.id || `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const source = `${payload.source || 'manual'}`.trim();
  const status = `${payload.status || 'active'}`.trim();

  await db
    .prepare(
      `INSERT INTO course_enrollments (id, institution_id, course_id, student_id, enrollment_status, source)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(id, institutionId, courseId, studentId, status, source)
    .run();

  return { id, institutionId, courseId, studentId, status, source };
};

const fetchLeadsByQueryRaw = async (db, filters = {}) => {
  const where = [];
  const values = [];
  const institutionId = `${filters.institutionId || ''}`.trim();
  const status = `${filters.status || ''}`.trim();

  if (institutionId) {
    values.push(institutionId);
    where.push(`institution_id = ?${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`status = ?${values.length}`);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderClause = 'ORDER BY created_at DESC';
  const list = await db
    .prepare(`SELECT * FROM leads ${clause} ${orderClause}`)
    .bind(...values)
    .all();

  return (list.results || []).map(normalizeLeadRow);
};

const insertLeadMessageRaw = async (db, payload = {}) => {
  const leadId = `${payload.leadId || ''}`.trim();
  if (!leadId) {
    return null;
  }

  const id = `${payload.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const actorRole = `${payload.actorRole || 'system'}`.trim();
  const sender = `${payload.sender || ''}`.trim();
  const message = `${payload.message || ''}`.trim();
  const tone = `${payload.tone || ''}`.trim();

  await db
    .prepare(
      `INSERT INTO lead_messages (id, lead_id, actor_role, sender, message, tone)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(id, leadId, actorRole, sender, message, tone)
    .run();

  return { id, leadId, actorRole, sender, message, tone };
};

const fetchLeadMessagesRaw = async (db, leadId) => {
  const list = await db
    .prepare('SELECT * FROM lead_messages WHERE lead_id = ?1 ORDER BY created_at DESC')
    .bind(leadId)
    .all();

  return (list.results || []).map(normalizeLeadMessageRow);
};

const createTrialBookingRaw = async (db, payload = {}) => {
  const leadId = `${payload.leadId || ''}`.trim();
  const institutionId = `${payload.institutionId || ''}`.trim();
  const courseId = `${payload.courseId || ''}`.trim();
  const teacherId = `${payload.teacherId || ''}`.trim();
  const reservedAt = `${payload.reservedAt || ''}`.trim();
  if (!leadId || !institutionId || !courseId || !reservedAt) {
    return null;
  }

  const id = `${payload.id || `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const status = `${payload.status || 'pending'}`.trim();
  const durationMinutes = Math.max(1, Math.round(Number(payload.durationMinutes || 60)));
  const sourceChannel = `${payload.sourceChannel || 'web'}`.trim();
  const notes = `${payload.notes || ''}`.trim();

  await db
    .prepare(
      `INSERT INTO trial_bookings (id, institution_id, lead_id, course_id, teacher_id, reserved_at, duration_minutes, source_channel, status, notes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    )
    .bind(
      id,
      institutionId,
      leadId,
      courseId,
      teacherId || null,
      reservedAt,
      durationMinutes,
      sourceChannel,
      status,
      notes
    )
    .run();

  return { id, institutionId, leadId, courseId, teacherId, reservedAt, durationMinutes, status };
};

const fetchTrialBookingsRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const status = `${filters.status || ''}`.trim();
  const where = [];
  const values = [];
  if (institutionId) {
    values.push(institutionId);
    where.push(`institution_id = ?${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`status = ?${values.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db
    .prepare(`SELECT * FROM trial_bookings ${clause} ORDER BY reserved_at DESC`)
    .bind(...values)
    .all();

  return (rows.results || []).map(normalizeTrialBookingRow);
};

const fetchStudentTasksByStudentRaw = async (db, studentId, institutionId, queryDate = '') => {
  const where = ['student_id = ?1'];
  const values = [studentId];
  if (institutionId) {
    values.push(institutionId);
    where.push(`institution_id = ?${values.length}`);
  }
  if (queryDate) {
    values.push(`${queryDate}`.trim());
    where.push(`substr(created_at, 1, 10) = ?${values.length}`);
  }

  const clause = `WHERE ${where.join(' AND ')}`;
  const rows = await db
    .prepare(
      `SELECT * FROM student_tasks
       ${clause}
       ORDER BY updated_at DESC`
    )
    .bind(...values)
    .all();

  return (rows.results || []).map(normalizeReviewTaskRow);
};

const insertStudentTaskReviewRaw = async (db, payload = {}) => {
  const studentId = `${payload.studentId || ''}`.trim();
  const institutionId = `${payload.institutionId || ''}`.trim();
  const taskType = `${payload.taskType || 'review'}`.trim();
  const title = `${payload.title || ''}`.trim();
  if (!studentId || !institutionId) {
    return null;
  }

  const id = `${payload.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const answer = `${payload.answer || ''}`.trim();
  const score = Math.max(0, Math.round(Number(payload.score || 0)));
  const status = `${payload.status || 'done'}`.trim();
  const payloadText = JSON.stringify(payload.payload || {});

  await db
    .prepare(
      `INSERT INTO student_tasks (id, institution_id, student_id, task_type, title, answer, score, status, payload)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(id, institutionId, studentId, taskType, title, answer, score, status, payloadText)
    .run();

  return { id, studentId, institutionId, taskType, title, answer, score, status };
};

const fetchReviewByStudentRaw = async (db, studentId, institutionId = '', limit = 100) => {
  const rows = await db
    .prepare(
      `SELECT * FROM student_tasks
       WHERE student_id = ?1 ${institutionId ? 'AND institution_id = ?2' : ''}
       ORDER BY updated_at DESC
       LIMIT ?${institutionId ? 3 : 2}`
    )
    .bind(...(institutionId ? [studentId, institutionId, Math.min(Math.max(limit, 1), 500)] : [studentId, Math.min(Math.max(limit, 1), 500)]))
    .all();

  return (rows.results || []).map(normalizeReviewTaskRow);
};

const fetchLatestVoicePracticeRaw = async (db, studentId, userId = '', institutionId = '') => {
  const rows = await db
    .prepare(
      `SELECT * FROM voice_practice_records
       WHERE student_id = ?1 ${userId ? 'AND user_id = ?2' : ''} ${institutionId ? `AND institution_id = ?${userId ? 3 : 2}` : ''}
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(...[
      studentId,
      ...(userId ? [userId] : []),
      ...(institutionId ? [institutionId] : [])
    ])
    .all();

  const row = rows.results?.[0];
  return row ? normalizeVoicePracticeRow(row) : null;
};

const insertVoicePracticeRaw = async (db, payload = {}) => {
  const id = `${payload.id || `vp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const studentId = `${payload.studentId || ''}`.trim();
  const userId = `${payload.userId || ''}`.trim();
  const institutionId = `${payload.institutionId || ''}`.trim();
  const taskId = `${payload.taskId || ''}`.trim();
  const transcript = `${payload.transcript || ''}`.trim();
  const score = Math.max(0, Math.round(Number(payload.score || 0)));
  const result = `${payload.result || ''}`.trim();
  const suggestions = JSON.stringify(Array.isArray(payload.suggestions) ? payload.suggestions : []);

  if (!studentId || !institutionId || !userId) {
    return null;
  }

  await db
    .prepare(
      `INSERT INTO voice_practice_records (id, institution_id, student_id, user_id, task_id, transcript, score, result, suggestions)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(id, institutionId, studentId, userId, taskId, transcript, score, result, suggestions)
    .run();

  return { id, studentId, userId, institutionId, taskId, score };
};

const fetchLessonAccountsByInstitutionRaw = async (db, institutionId) => {
  if (!institutionId) {
    return [];
  }

  const list = await db
    .prepare(
      `SELECT * FROM lesson_accounts
       WHERE institution_id = ?1
       ORDER BY created_at DESC`
    )
    .bind(institutionId)
    .all();

  return list.results || [];
};

const adjustLessonAccountRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const studentId = `${payload.studentId || ''}`.trim();
  if (!institutionId || !studentId) {
    return null;
  }

  const purchasedHours = Math.max(0, Math.round(Number(payload.purchasedHours || 0)));
  const reason = `${payload.reason || ''}`.trim();
  const amountCents = Math.max(0, Math.round(Number(payload.amountCents || 0)));
  const adjustId = `account-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const existing = await db
    .prepare('SELECT remaining_hours FROM lesson_accounts WHERE student_id = ?1 ORDER BY created_at DESC LIMIT 1')
    .bind(studentId)
    .first();

  const current = toNumber(existing?.remaining_hours, 0);
  const finalRemain = Math.max(0, current + purchasedHours);

  await db
    .prepare(
      `INSERT INTO lesson_accounts
       (id, institution_id, student_id, purchased_hours, remaining_hours, amount_cents, notes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(adjustId, institutionId, studentId, purchasedHours, finalRemain, amountCents, reason)
    .run();

  return {
    id: adjustId,
    institutionId,
    studentId,
    purchasedHours,
    remainingHours: finalRemain,
    amountCents,
    reason
  };
};

const fetchFounderAttendanceRecordsRaw = async (db, institutionId, filters = {}) => {
  const where = ['institution_id = ?1'];
  const values = [institutionId];
  const startAt = `${filters.startAt || ''}`.trim();
  const endAt = `${filters.endAt || ''}`.trim();
  const studentId = `${filters.studentId || ''}`.trim();
  const courseId = `${filters.courseId || ''}`.trim();
  if (studentId) {
    values.push(studentId);
    where.push(`student_id = ?${values.length}`);
  }
  if (courseId) {
    values.push(courseId);
    where.push(`course_id = ?${values.length}`);
  }
  if (startAt) {
    values.push(startAt);
    where.push(`attended_at >= ?${values.length}`);
  }
  if (endAt) {
    values.push(endAt);
    where.push(`attended_at <= ?${values.length}`);
  }

  const rows = await db
    .prepare(
      `SELECT * FROM attendance_records
       WHERE ${where.join(' AND ')}
       ORDER BY attended_at DESC`
    )
    .bind(...values)
    .all();

  return (rows.results || []).map(normalizeAttendanceRow);
};

const fetchTeacherAttendanceSheetRaw = async (db, courseId, institutionId = '') => {
  const rows = await db
    .prepare(
      `SELECT ar.id, ar.institution_id, ar.course_id, ar.student_id, ar.teacher_id, ar.status,
              ar.note, ar.source_lesson_id, ar.attended_at, ar.created_at,
              s.name AS student_name, s.grade AS student_grade
         FROM attendance_records ar
         JOIN students s ON s.id = ar.student_id
        WHERE ar.course_id = ?1 ${institutionId ? 'AND ar.institution_id = ?2' : ''}
        ORDER BY ar.attended_at DESC`
    )
    .bind(...(institutionId ? [courseId, institutionId] : [courseId]))
    .all();

  return (rows.results || []).map((item) => ({
    ...(normalizeAttendanceRow(item)),
    studentName: `${item.student_name || ''}`,
    studentGrade: `${item.student_grade || ''}`
  }));
};

const fetchAttendanceByTeacherRaw = async (db, institutionId, teacherId, filters = {}) => {
  if (!institutionId || !teacherId) {
    return [];
  }

  const where = ['ar.institution_id = ?1', 'ar.teacher_id = ?2'];
  const values = [institutionId, teacherId];

  const status = `${filters.status || ''}`.trim();
  const studentId = `${filters.studentId || ''}`.trim();
  const courseId = `${filters.courseId || ''}`.trim();
  const startAt = `${filters.startAt || ''}`.trim();
  const endAt = `${filters.endAt || ''}`.trim();

  if (status) {
    where.push(`ar.status = ?${values.length + 1}`);
    values.push(status);
  }
  if (studentId) {
    where.push(`ar.student_id = ?${values.length + 1}`);
    values.push(studentId);
  }
  if (courseId) {
    where.push(`ar.course_id = ?${values.length + 1}`);
    values.push(courseId);
  }
  if (startAt) {
    where.push(`ar.attended_at >= ?${values.length + 1}`);
    values.push(startAt);
  }
  if (endAt) {
    where.push(`ar.attended_at <= ?${values.length + 1}`);
    values.push(endAt);
  }

  const rows = await db
    .prepare(
      `SELECT ar.id, ar.institution_id, ar.course_id, ar.student_id, ar.teacher_id, ar.status,
              ar.note, ar.source_lesson_id, ar.attended_at, ar.created_at,
              s.name AS student_name, c.name AS course_name
         FROM attendance_records ar
         JOIN students s ON s.id = ar.student_id
         JOIN courses c ON c.id = ar.course_id
        WHERE ${where.join(' AND ')}
        ORDER BY ar.attended_at DESC`
    )
    .bind(...values)
    .all();

  return (rows.results || []).map((item) => ({
    ...normalizeAttendanceRow(item),
    studentName: `${item.student_name || ''}`,
    courseName: `${item.course_name || ''}`
  }));
};

const upsertAttendanceRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const courseId = `${payload.courseId || ''}`.trim();
  const studentId = `${payload.studentId || ''}`.trim();
  const teacherId = `${payload.teacherId || ''}`.trim();
  const status = `${payload.status || 'absent'}`.trim();
  const note = `${payload.note || ''}`.trim();
  const attendedAt = `${payload.attendedAt || ''}`.trim() || new Date().toISOString();
  const sourceLessonId = `${payload.sourceLessonId || ''}`.trim();

  if (!institutionId || !courseId || !studentId || !teacherId) {
    return null;
  }

  const id = `${payload.id || `att-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;

  await db
    .prepare(
      `INSERT OR REPLACE INTO attendance_records
       (id, institution_id, course_id, student_id, teacher_id, status, note, source_lesson_id, attended_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
    .bind(id, institutionId, courseId, studentId, teacherId, status, note, sourceLessonId, attendedAt)
    .run();

  return {
    id,
    institutionId,
    courseId,
    studentId,
    teacherId,
    status,
    note,
    sourceLessonId,
    attendedAt
  };
};

const fetchPaymentRecordsByInstitutionRaw = async (db, filters = {}) => {
  const institutionId = `${filters.institutionId || ''}`.trim();
  const studentId = `${filters.studentId || ''}`.trim();
  const status = `${filters.status || ''}`.trim();

  if (!institutionId) {
    return [];
  }

  const where = ['institution_id = ?1'];
  const values = [institutionId];
  if (studentId) {
    values.push(studentId);
    where.push(`student_id = ?${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`status = ?${values.length}`);
  }

  const rows = await db
    .prepare(`SELECT * FROM payment_records WHERE ${where.join(' AND ')} ORDER BY created_at DESC`)
    .bind(...values)
    .all();

  return (rows.results || []).map(normalizePaymentRecordRow);
};

const insertPaymentRecordRaw = async (db, payload = {}) => {
  const institutionId = `${payload.institutionId || ''}`.trim();
  const studentId = `${payload.studentId || ''}`.trim();
  const courseId = `${payload.courseId || ''}`.trim();
  const amountCents = Math.max(0, Math.round(Number(payload.amountCents || 0)));
  const paymentMethod = `${payload.paymentMethod || ''}`.trim();

  if (!institutionId || !studentId || !courseId || !amountCents) {
    return null;
  }

  const id = `${payload.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
  const orderNo = `${payload.orderNo || `PO${Date.now()}`}`.trim();
  const status = `${payload.status || 'pending'}`.trim();
  const currency = `${payload.currency || 'CNY'}`.trim();
  const notes = `${payload.notes || ''}`.trim();
  const paidAt = `${payload.paidAt || ''}`.trim();

  await db
    .prepare(
      `INSERT INTO payment_records (id, institution_id, student_id, course_id, order_no, amount_cents, currency, payment_method, status, paid_at, notes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
    )
    .bind(id, institutionId, studentId, courseId, orderNo, amountCents, currency, paymentMethod, status, paidAt, notes)
    .run();

  return { id, institutionId, studentId, courseId, orderNo, amountCents, currency, status };
};

const fetchParentChildrenRaw = async (db, institutionId, parentUserId, limit = 100) => {
  const safeLimit = Math.min(Math.max(Math.round(Number(limit) || 100), 1), 500);
  if (!institutionId || !parentUserId) {
    return [];
  }

  const parent = await db
    .prepare('SELECT phone, name FROM users WHERE id = ?1 LIMIT 1')
    .bind(parentUserId)
    .first();

  const phone = `${parent?.phone || ''}`.trim();
  const parentName = `${parent?.name || ''}`.trim();

  if (!phone && !parentName) {
    return [];
  }

  const matchClauses = [];
  const bindValues = [institutionId];

  if (phone) {
    matchClauses.push('(g.phone = ?2 OR g.phone_encrypted = ?2 OR g.wechat = ?2 OR g.wechat_encrypted = ?2)');
    bindValues.push(phone);
  }

  if (parentName) {
    const nameSlot = bindValues.length + 1;
    matchClauses.push(`g.name = ?${nameSlot}`);
    bindValues.push(parentName);
  }

  const list = await db
    .prepare(
      `SELECT s.id AS student_id, s.name AS student_name, s.grade, g.name AS parent_name
         FROM students s
         JOIN guardians g ON g.id = s.guardian_id
         WHERE s.institution_id = ?1
           AND (${matchClauses.join(' OR ')})
         ORDER BY s.created_at DESC
         LIMIT ?${bindValues.length + 1}`,
    )
    .bind(...bindValues, safeLimit)
    .all();

  return (list.results || []).map((item) => ({
    studentId: item.student_id,
    studentName: item.student_name,
    grade: item.grade,
    parentName: item.parent_name
  }));
};


export const fetchInstitutionById = safeParseDb(fetchInstitutionByIdRaw);
export const fetchOrganizationsForPlatform = safeParseDb(fetchOrganizationsForPlatformRaw);
export const fetchPlatformSummary = safeParseDb(fetchPlatformSummaryRaw);
export const fetchStudentsByInstitution = safeParseDb(fetchStudentsByInstitutionRaw);
export const fetchStudentsByTeacher = safeParseDb(fetchStudentsByTeacherRaw);
export const fetchStudentById = safeParseDb(fetchStudentByIdRaw);
export const fetchTeachersByInstitution = safeParseDb(fetchTeachersByInstitutionRaw);
export const fetchUserById = safeParseDb(fetchUserByIdRaw);
export const insertStudent = safeParseDb(insertStudentRaw);
export const updateStudent = safeParseDb(updateStudentRaw);
export const updateStudentTeacher = safeParseDb(updateStudentTeacherRaw);
export const fetchLessons = safeParseDb(fetchLessonsRaw);
export const fetchLessonById = safeParseDb(fetchLessonByIdRaw);
export const insertLesson = safeParseDb(insertLessonRaw);
export const updateLesson = safeParseDb(updateLessonRaw);
export const ensureLessonAccountEnough = safeParseDb(ensureLessonAccountEnoughRaw);
export const consumeLessonAccount = safeParseDb(consumeLessonAccountRaw);
export const fetchLeadsByInstitution = safeParseDb(fetchLeadsByInstitutionRaw);
export const fetchLeadsByQuery = safeParseDb(fetchLeadsByQueryRaw);
export const insertLeadMessage = safeParseDb(insertLeadMessageRaw);
export const fetchLeadMessages = safeParseDb(fetchLeadMessagesRaw);
export const createTrialBooking = safeParseDb(createTrialBookingRaw);
export const fetchTrialBookings = safeParseDb(fetchTrialBookingsRaw);
export const fetchCourses = safeParseDb(fetchCoursesRaw);
export const fetchCourseById = safeParseDb(fetchCourseByIdRaw);
export const fetchCoursesByTeacher = safeParseDb(fetchCoursesByTeacherRaw);
export const insertCourse = safeParseDb(insertCourseRaw);
export const updateCourse = safeParseDb(updateCourseRaw);
export const fetchStudentCourses = safeParseDb(fetchStudentCoursesRaw);
export const fetchCourseEnrollments = safeParseDb(fetchCourseEnrollmentsRaw);
export const upsertCourseEnrollment = safeParseDb(upsertCourseEnrollmentRaw);
export const fetchStudentTasksByStudent = safeParseDb(fetchStudentTasksByStudentRaw);
export const insertStudentTaskReview = safeParseDb(insertStudentTaskReviewRaw);
export const fetchReviewByStudent = safeParseDb(fetchReviewByStudentRaw);
export const fetchLatestVoicePractice = safeParseDb(fetchLatestVoicePracticeRaw);
export const insertVoicePractice = safeParseDb(insertVoicePracticeRaw);
export const fetchLessonAccountsByInstitution = safeParseDb(fetchLessonAccountsByInstitutionRaw);
export const adjustLessonAccount = safeParseDb(adjustLessonAccountRaw);
export const fetchFounderAttendanceRecords = safeParseDb(fetchFounderAttendanceRecordsRaw);
export const fetchTeacherAttendanceSheet = safeParseDb(fetchTeacherAttendanceSheetRaw);
export const fetchAttendanceByTeacher = safeParseDb(fetchAttendanceByTeacherRaw);
export const upsertAttendance = safeParseDb(upsertAttendanceRaw);
export const fetchPaymentRecordsByInstitution = safeParseDb(fetchPaymentRecordsByInstitutionRaw);
export const insertPaymentRecord = safeParseDb(insertPaymentRecordRaw);
export const fetchLatestLessonAccountByStudent = safeParseDb(fetchLatestLessonAccountByStudentRaw);
export const fetchParentChildren = safeParseDb(fetchParentChildrenRaw);
export const insertLead = safeParseDb(insertLeadRaw);
export const updateLead = safeParseDb(updateLeadRaw);
export const fetchPaymentsByInstitution = safeParseDb(fetchPaymentsByInstitutionRaw);
export const fetchPaymentById = safeParseDb(fetchPaymentByIdRaw);
export const insertPayment = safeParseDb(insertPaymentRaw);
export const updatePayment = safeParseDb(updatePaymentRaw);
export const fetchPermissionsByInstitution = safeParseDb(fetchPermissionsByInstitutionRaw);
export const grantPermission = safeParseDb(grantPermissionRaw);
export const revokePermission = safeParseDb(revokePermissionRaw);
export const insertInstitution = safeParseDb(insertInstitutionRaw);
export const updateInstitutionById = safeParseDb(updateInstitutionStatusRaw);
export const fetchCultureWallAssetsByInstitution = safeParseDb(fetchCultureWallAssetsByInstitutionRaw);
export const fetchCultureWallAssetById = safeParseDb(fetchCultureWallAssetByIdRaw);
export const insertCultureWallAsset = safeParseDb(insertCultureWallAssetRaw);
export const insertCultureWallAssetUnsafe = insertCultureWallAssetRaw;
export const deleteCultureWallAsset = safeParseDb(deleteCultureWallAssetRaw);
export const insertAiUsage = safeParseDb(insertAiUsageRaw);
export const fetchAiUsageSummary = safeParseDb(fetchAiUsageSummaryRaw);
export const fetchAiUsageTopUsers = safeParseDb(fetchAiUsageTopUsersRaw);
export const fetchAiUsageSourceSummary = safeParseDb(fetchAiUsageSourceSummaryRaw);
export const increaseInstitutionAiUsage = safeParseDb(increaseInstitutionAiUsageRaw);
export const insertAiAuditLog = safeParseDb(insertAiAuditLogRaw);
export const fetchAiAuditLogs = safeParseDb(fetchAiAuditLogsRaw);
export const fetchAiAuditSourceSummary = safeParseDb(fetchAiAuditSourceSummaryRaw);

export const FALLBACK_PLAN_LIMITS = planLimitMap;
