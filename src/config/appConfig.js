export const APP_COPY = {
  brandZh: 'Aggie速记英语',
  brandEn: 'Aggie速记英语',
  appShellTitle: 'Aggie速记英语',
  brandTagline: '少儿英语学习与家校协同平台',
  currentPlanText: '当前套餐',
  aiModeText: 'AI模式',
  simulatedText: '本地连接模式'
};

export const UI_COPY = {
  loading: {
    refreshing: '刷新中...',
    exporting: '导出中...'
  },
  actions: {
    exportPdf: '导出PDF',
    refreshData: '刷新数据',
    refreshTeacherBoard: '刷新教师看板',
    refreshParentBoard: '刷新家长看板',
    refreshTaskBoard: '刷新任务',
    refreshPublicCourses: '刷新课程'
  },
  empty: {
    noExecution: '暂无执行记录',
    noExecutionDetail: '执行完成后会显示最新记录。',
    noExecutionReady: '功能就绪后会显示最新结果。',
    noExecutionAutoSave: '执行结果会自动入库并归档。',
    noResults: '暂无可查询结果',
    noLeads: '当前无待跟进线索',
    noCourseData: '课程数据未同步',
    noClasses: '未生成课程安排',
    noPublicCourses: '当前暂无可公开课程',
    noLearningNeed: '请补充学习需求',
    noLessons: '课时明细未填写',
    noLessonAccounts: '课时账户未配置',
    noPayments: '收费记录未录入',
    noPaymentRecords: '收费记录未生成',
    noAttendanceRecords: '到课记录未生成',
    noExceptions: '未检测到异常记录',
    noAuditRecords: '审计记录未生成',
    noAiUsageRecords: 'AI 用量数据未返回',
    noFeaturedContent: '学习档案精选内容未发布',
    noUpdates: '近期学习记录未生成'
  },
  status: {
    updated: '已更新',
    pending: '待确认'
  }
};

export const MENU_CONFIG = {
  roleTabs: [
    { id: 'founder', label: '创始人', icon: 'Crown' },
    { id: 'teacher', label: '老师', icon: 'BookOpenCheck' },
    { id: 'parent', label: '家长', icon: 'MessageCircleHeart' },
    { id: 'student', label: '学生', icon: 'GraduationCap' },
    { id: 'platform', label: '平台运营', icon: 'Building2' }
  ],
  navItems: [
    { id: 'founder', label: '创始人驾驶舱', icon: 'LayoutDashboard' },
    { id: 'teacher', label: '老师工作台', icon: 'CalendarDays' },
    { id: 'parent', label: '家长中心', icon: 'MessageCircleHeart' },
    { id: 'student', label: '学生中心', icon: 'GraduationCap' },
    { id: 'platform', label: '平台运营', icon: 'Building2' }
  ]
};

export const ORG_STATUS = {
  normal: '正常',
  trial: '试用中',
  expired: '已到期'
};

export const PLATFORM_EXPIRY_ACTION_COPY = {
  convert: {
    label: '转正式运营',
    policy: '开通正式套餐后解除试用限制'
  },
  extend: {
    label: '延长试用期',
    policy: '保留试用状态并更新到期日'
  },
  readonly: {
    label: '转只读观察',
    policy: '保留历史数据，暂停新增业务操作'
  },
  freeze: {
    label: '冻结新操作',
    policy: '保留历史数据，禁止新增课程、线索和课时动作'
  }
};

export const PLATFORM_EXPIRY_POLICY_TEXT = {
  [ORG_STATUS.normal]: `${PLATFORM_EXPIRY_ACTION_COPY.readonly.label}，${PLATFORM_EXPIRY_ACTION_COPY.readonly.policy}`,
  [ORG_STATUS.trial]: `${PLATFORM_EXPIRY_ACTION_COPY.freeze.label}，待${PLATFORM_EXPIRY_ACTION_COPY.convert.label}`,
  [ORG_STATUS.expired]: `${PLATFORM_EXPIRY_ACTION_COPY.readonly.label}，待${PLATFORM_EXPIRY_ACTION_COPY.convert.label}`
};

export function getPlatformExpiryActionLabel(action = {}) {
  const actionKey = `${action.actionKey || ''}`.trim();
  if (actionKey && PLATFORM_EXPIRY_ACTION_COPY[actionKey]) {
    return PLATFORM_EXPIRY_ACTION_COPY[actionKey].label;
  }
  if (action.targetStatus === ORG_STATUS.normal) {
    return PLATFORM_EXPIRY_ACTION_COPY.convert.label;
  }
  if (action.targetStatus === ORG_STATUS.trial) {
    return PLATFORM_EXPIRY_ACTION_COPY.extend.label;
  }
  if (action.targetStatus === ORG_STATUS.expired) {
    return PLATFORM_EXPIRY_ACTION_COPY.freeze.label;
  }
  return `${action.label || UI_COPY.status.pending}`.trim();
}

export function getPlatformExpiryPolicyText(item = {}) {
  const status = `${item.status || ''}`.trim();
  const normalizedPolicy = `${item.expiryAction || PLATFORM_EXPIRY_POLICY_TEXT[status] || PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.trial]}`.trim();

  if (normalizedPolicy.includes(PLATFORM_EXPIRY_ACTION_COPY.freeze.label)) {
    return PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.trial];
  }
  if (normalizedPolicy.includes(PLATFORM_EXPIRY_ACTION_COPY.readonly.label)) {
    return status === ORG_STATUS.normal ? PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.normal] : PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.expired];
  }
  if (normalizedPolicy.includes(PLATFORM_EXPIRY_ACTION_COPY.convert.label)) {
    return `${PLATFORM_EXPIRY_ACTION_COPY.convert.label}，${PLATFORM_EXPIRY_ACTION_COPY.convert.policy}`;
  }
  return PLATFORM_EXPIRY_POLICY_TEXT[status] || normalizedPolicy;
}

export const ORG_STATUS_DEFAULTS = {
  [ORG_STATUS.normal]: {
    planMode: '月付',
    expiryAction: PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.normal],
    dayOffset: 30
  },
  [ORG_STATUS.trial]: {
    plan: '体验版',
    planMode: '试用',
    expiryAction: PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.trial],
    dayOffset: 14
  },
  [ORG_STATUS.expired]: {
    planMode: '已到期',
    expiryAction: PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.expired],
    dayOffset: -3
  }
};

export const ORG_ACTIONS_BY_STATUS = {
  [ORG_STATUS.normal]: [
    {
      actionKey: 'readonly',
      label: PLATFORM_EXPIRY_ACTION_COPY.readonly.label,
      targetStatus: ORG_STATUS.normal,
      patch: {
        expiryAction: PLATFORM_EXPIRY_POLICY_TEXT[ORG_STATUS.normal]
      }
    },
    {
      actionKey: 'freeze',
      label: PLATFORM_EXPIRY_ACTION_COPY.freeze.label,
      targetStatus: ORG_STATUS.expired
    }
  ],
  [ORG_STATUS.trial]: [
    {
      actionKey: 'convert',
      label: PLATFORM_EXPIRY_ACTION_COPY.convert.label,
      targetStatus: ORG_STATUS.normal
    },
    {
      actionKey: 'extend',
      label: PLATFORM_EXPIRY_ACTION_COPY.extend.label,
      targetStatus: ORG_STATUS.trial
    }
  ],
  [ORG_STATUS.expired]: [
    {
      actionKey: 'convert',
      label: PLATFORM_EXPIRY_ACTION_COPY.convert.label,
      targetStatus: ORG_STATUS.normal
    },
    {
      actionKey: 'extend',
      label: PLATFORM_EXPIRY_ACTION_COPY.extend.label,
      targetStatus: ORG_STATUS.trial
    }
  ]
};
