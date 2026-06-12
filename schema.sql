-- 星伴英语 SaaS v2 -> v4.1 第一阶段内部执行版数据库结构
-- 目标：支持：招生咨询、课程排课与试听预约、课时打卡、学生课时/缴费闭环

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan_code TEXT NOT NULL DEFAULT 'trial',
  plan_mode TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'trial',
  student_limit INTEGER NOT NULL DEFAULT 0,
  teacher_limit INTEGER NOT NULL DEFAULT 0,
  ai_limit_monthly INTEGER NOT NULL DEFAULT 0,
  ai_used_month INTEGER NOT NULL DEFAULT 0,
  trial_ends_at TEXT,
  subscription_starts_at TEXT,
  subscription_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  role TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  wechat TEXT,
  phone_encrypted TEXT,
  wechat_encrypted TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  guardian_id TEXT NOT NULL,
  teacher_id TEXT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  weakness_points TEXT,
  renewal_risk INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (guardian_id) REFERENCES guardians(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  teacher_id TEXT,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  level TEXT,
  class_type TEXT,
  course_type TEXT,
  start_date TEXT,
  end_date TEXT,
  weekday TEXT,
  time_slot TEXT,
  schedule TEXT,
  start_time TEXT,
  duration_minutes INTEGER DEFAULT 90,
  total_sessions INTEGER,
  session_duration INTEGER,
  capacity INTEGER NOT NULL DEFAULT 12,
  price_cents INTEGER NOT NULL DEFAULT 0,
  single_period_price INTEGER,
  bundle_price INTEGER,
  remaining_seats INTEGER,
  classroom TEXT,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT,
  enrolled_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  enrollment_status TEXT NOT NULL DEFAULT 'active',
  source TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS student_tasks (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'review',
  title TEXT,
  answer TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS voice_practice_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT,
  transcript TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  result TEXT,
  suggestions TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  hours_used INTEGER NOT NULL DEFAULT 1,
  teacher_note TEXT,
  parent_feedback TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS lesson_accounts (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  purchased_hours INTEGER NOT NULL DEFAULT 0,
  used_hours INTEGER NOT NULL DEFAULT 0,
  hold_hours INTEGER NOT NULL DEFAULT 0,
  remaining_hours INTEGER NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  paid_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent',
  note TEXT,
  source_lesson_id TEXT,
  attended_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  student_grade TEXT,
  need_summary TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ai_recommendation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS lead_messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  sender TEXT,
  message TEXT,
  tone TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS trial_bookings (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  teacher_id TEXT,
  reserved_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  source_channel TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  order_no TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CNY',
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT,
  order_no TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  plan_code TEXT NOT NULL,
  plan_mode TEXT NOT NULL,
  period_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  starts_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS culture_wall_assets (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  uploader TEXT,
  media_key TEXT,
  media_url TEXT,
  cover_url TEXT,
  duration TEXT,
  status TEXT,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT,
  agent_code TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id TEXT PRIMARY KEY,
  institution_id TEXT,
  user_id TEXT,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT,
  source TEXT,
  client_ip TEXT,
  request_payload TEXT,
  latency_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  permission_code TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_guardians_institution ON guardians(institution_id);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardians_phone_enc ON guardians(phone_encrypted);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_guardian ON students(guardian_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_institution ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_class_type ON courses(class_type);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_institution ON course_enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_type ON student_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_voice_practice_student ON voice_practice_records(student_id);
CREATE INDEX IF NOT EXISTS idx_voice_practice_user ON voice_practice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_institution ON lessons(institution_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_accounts_student ON lesson_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_accounts_institution ON lesson_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance_records(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_leads_institution ON leads(institution_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_institution ON trial_bookings(institution_id);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_lead ON trial_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_course ON trial_bookings(course_id);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON trial_bookings(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_institution ON payment_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_student ON payment_records(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_course ON payment_records(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payments_institution ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_culture_wall_assets_institution ON culture_wall_assets(institution_id, kind, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_institution ON ai_usage(institution_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_institution ON ai_audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_action ON ai_audit_logs(action, decision, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_perm ON user_permissions(user_id, permission_code);

INSERT OR IGNORE INTO institutions (
  id,
  name,
  plan_code,
  plan_mode,
  status,
  student_limit,
  teacher_limit,
  ai_limit_monthly,
  ai_used_month,
  trial_ends_at,
  subscription_starts_at,
  subscription_ends_at
)
VALUES
('inst-star', '星伴英语本部', 'standard', 'monthly', 'normal', 500, 20, 10000, 7840, NULL, CURRENT_TIMESTAMP, '2027-06-04T00:00:00Z');

INSERT OR IGNORE INTO users (
  id,
  institution_id,
  role,
  username,
  password_hash,
  name,
  phone,
  email,
  status
)
VALUES
('u_platform_01', NULL, 'platform', 'platform', 'sha256:00fdc8d12a1b83c0de0df3748fd5079fcda3e6550b493461c08350e3213ac3c7', '平台管理员', NULL, NULL, 'active'),
('u_founder_01', 'inst-star', 'founder', 'founder', 'sha256:b34061f9809c9a0f8a4b710340db8d196bfd30378a86967481afb9ca12e480f1', '星伴英语本部', NULL, NULL, 'active'),
('u_teacher_01', 'inst-star', 'teacher', 'teacher', 'sha256:d041c3d3ca4ed64c5b54c5d807bd9a0bd2d6ae3609ecd2d06ac383db449360e1', '王老师', NULL, NULL, 'active'),
('u_parent_01', 'inst-star', 'parent', 'parent', 'sha256:02e213a1388234c768fd561c4114d124eaa9cca64cf9d8b118b52001c93952d7', '小宇家长', NULL, NULL, 'active'),
('u_student_01', 'inst-star', 'student', 'student', 'sha256:b2a1f4fd0a460606b34c8913e2981dac8d2e283d778aba586c416ee2629bfa54', '小宇', NULL, NULL, 'active');

INSERT OR IGNORE INTO guardians (
  id,
  institution_id,
  name,
  phone,
  wechat,
  phone_encrypted,
  wechat_encrypted,
  source
)
VALUES
('g_001', 'inst-star', '小宇家长', '13000000001', 'wx_small', 'aes:placeholder:phone', 'aes:placeholder:wechat', 'seed');

INSERT OR IGNORE INTO students (
  id,
  institution_id,
  guardian_id,
  teacher_id,
  name,
  grade,
  weakness_points,
  renewal_risk
)
VALUES
('s_001', 'inst-star', 'g_001', 'u_teacher_01', '小宇', '五年级', '关键词定位速度偏慢', 12);

INSERT OR IGNORE INTO courses (
  id,
  institution_id,
  teacher_id,
  name,
  grade,
  level,
  class_type,
  course_type,
  weekday,
  start_time,
  duration_minutes,
  capacity,
  price_cents,
  currency,
  status,
  schedule,
  single_period_price,
  bundle_price,
  remaining_seats,
  classroom
)
VALUES
('course_001', 'inst-star', 'u_teacher_01', '小升初英语衔接营', '五年级', '进阶', 'small', '音标', '周一,周三', '14:00-15:30', 90, 20, 28000, 'CNY', 'active', '周一/周三 14:00-15:30', 2800, 25000, 18, '线上教室A');

INSERT OR IGNORE INTO course_enrollments (
  id,
  institution_id,
  course_id,
  student_id,
  enrollment_status,
  source
)
VALUES
('enr_001', 'inst-star', 'course_001', 's_001', 'active', 'seed');

INSERT OR IGNORE INTO lesson_accounts (
  id,
  institution_id,
  student_id,
  purchased_hours,
  used_hours,
  hold_hours,
  remaining_hours,
  amount_cents,
  notes,
  paid_at,
  expires_at
)
VALUES
('la_001', 'inst-star', 's_001', 20, 14, 0, 6, 60000, '入会赠课', CURRENT_TIMESTAMP, '2027-06-04T00:00:00Z');

INSERT OR IGNORE INTO lessons (
  id,
  institution_id,
  student_id,
  teacher_id,
  topic,
  status,
  hours_used,
  teacher_note,
  parent_feedback
)
VALUES
('lesson_001', 'inst-star', 's_001', 'u_teacher_01', '小升初阅读', 'completed', 1, '定位关键词速度偏慢', '家长反馈：已安排复读 10 分钟。');

INSERT OR IGNORE INTO leads (
  id,
  institution_id,
  guardian_name,
  student_grade,
  need_summary,
  status,
  ai_recommendation
)
VALUES
('lead_001', 'inst-star', '王阿姨', '五年级', '自然拼读有明显提升', 'new', '建议每晚 15 分钟词汇复习');

INSERT OR IGNORE INTO lead_messages (
  id,
  lead_id,
  actor_role,
  sender,
  message,
  tone
)
VALUES
('msg_001', 'lead_001', 'system', 'AI咨询助手', '欢迎咨询，已记录孩子信息。', 'neutral');

INSERT OR IGNORE INTO payment_records (
  id,
  institution_id,
  student_id,
  course_id,
  order_no,
  amount_cents,
  currency,
  payment_method,
  status,
  paid_at,
  notes
)
VALUES
('payr_001', 'inst-star', 's_001', 'course_001', 'PRD-001-S1', 120000, 'CNY', 'cash', 'paid', CURRENT_TIMESTAMP, '新学期一期预付');

INSERT OR IGNORE INTO attendance_records (
  id,
  institution_id,
  course_id,
  student_id,
  teacher_id,
  status,
  note,
  source_lesson_id,
  attended_at
)
VALUES
('att_001', 'inst-star', 'course_001', 's_001', 'u_teacher_01', 'attended', '课堂到课', 'lesson_001', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO ai_usage (
  id,
  institution_id,
  user_id,
  agent_code,
  tokens_used
)
VALUES
('ai_001', 'inst-star', 'u_teacher_01', 'feedback_agent', 120);
