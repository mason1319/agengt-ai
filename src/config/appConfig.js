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

export const ORG_STATUS_DEFAULTS = {
  [ORG_STATUS.normal]: {
    planMode: '月付',
    expiryAction: '到期转只读，保留历史',
    dayOffset: 30
  },
  [ORG_STATUS.trial]: {
    plan: '体验版',
    planMode: '试用',
    expiryAction: '到期转只读',
    dayOffset: 14
  },
  [ORG_STATUS.expired]: {
    planMode: '已到期',
    expiryAction: '到期后只读',
    dayOffset: -3
  }
};

export const ORG_ACTIONS_BY_STATUS = {
  [ORG_STATUS.normal]: [
    {
      label: '更新配置',
      targetStatus: ORG_STATUS.normal,
      patch: {
        expiryAction: '到期转只读，保留历史'
      }
    },
    {
      label: '停用',
      targetStatus: ORG_STATUS.expired
    }
  ],
  [ORG_STATUS.trial]: [
    {
      label: '转正式',
      targetStatus: ORG_STATUS.normal
    },
    {
      label: '延长试用',
      targetStatus: ORG_STATUS.trial
    }
  ],
  [ORG_STATUS.expired]: [
    {
      label: '续费恢复',
      targetStatus: ORG_STATUS.normal
    },
    {
      label: '试用演练',
      targetStatus: ORG_STATUS.trial
    }
  ]
};
