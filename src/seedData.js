import {
  BookOpenCheck,
  Bot,
  CreditCard,
  MessageCircleHeart,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WandSparkles
} from 'lucide-react';

export const founderAlerts = [
  {
    title: '8名学生剩余课时低于4节',
    desc: '建议今天完成续费沟通，AI已生成家长话术。',
    action: '去跟进',
    tone: 'yellow'
  },
  {
    title: '3条新试听线索超过12小时未联系',
    desc: '五年级阅读薄弱、初三中考冲刺、高一语法断层。',
    action: '分配销售',
    tone: 'red'
  },
  {
    title: '王老师还有5条课后反馈未提交',
    desc: '系统已提醒老师，超过24小时将进入创始人预警。',
    action: '提醒老师',
    tone: 'blue'
  },
  {
    title: '2名学员连续两周作业完成差',
    desc: '星守官判断存在流失风险，建议安排家长沟通。',
    action: '看诊断',
    tone: 'red'
  }
];

export const leadPipeline = [
  { stage: '新线索', count: 18, percent: 80 },
  { stage: '已联系', count: 42, percent: 65 },
  { stage: '已试听', count: 15, percent: 45 },
  { stage: '已成交', count: 9, percent: 32 }
];

export const teacherLessons = [
  {
    id: 'l1',
    time: '16:30',
    student: '小宇',
    grade: '五年级',
    course: '小升初阅读',
    name: '小升初阅读 · 关键词训练',
    courseName: '小升初阅读 · 关键词训练',
    title: '小升初阅读 · 关键词训练',
    classType: '小班课',
    amount_cents: 12800,
    topic: '阅读主旨题与关键词定位',
    class_date: '2026-06-07',
    energy: '积极',
    risk: '定位关键词速度偏慢'
  },
  {
    id: 'l2',
    time: '17:30',
    student: '佳佳',
    grade: '初一',
    course: '课内同步',
    name: '课内同步 · 语法巩固',
    courseName: '课内同步 · 语法巩固',
    title: '课内同步 · 语法巩固',
    classType: '小班课',
    amount_cents: 9800,
    topic: '一般过去时',
    class_date: '2026-06-07',
    energy: '稳定',
    risk: '动词过去式变化不够熟练'
  },
  {
    id: 'l3',
    time: '19:00',
    student: '泽远',
    grade: '高一',
    course: '高中语法',
    name: '高中语法 · 定语从句',
    courseName: '高中语法 · 定语从句',
    title: '高中语法 · 定语从句',
    classType: '一对一',
    amount_cents: 16800,
    topic: '定语从句基础',
    class_date: '2026-06-07',
    energy: '需要鼓励',
    risk: '句子成分分析基础较弱'
  }
];

export const students = [
  {
    id: 's_001',
    name: '小宇',
    grade: '五年级',
    course: '小升初阅读 · 关键词训练',
    progress: 76,
    hoursLeft: 6
  }
];

export const parentReports = [
  {
    student: '小宇',
    weekLearned: '3节课已完成，包含自然拼读+阅读+语法',
    strength: '阅读自读能力与发音清晰度提升明显',
    weakness: '长元音识别和速度控制仍需加强',
    nextStep: '每晚 10 分钟口语复读，家长按进度提醒',
    summary: '本周孩子在自然拼读和基础阅读有明显进步，建议保持每日至少一次复盘，重点补齐长元音和阅读速度。'
  }
];

export const parentMessages = [
  {
    id: 'pm_001',
    studentId: 's_001',
    actorRole: 'system',
    sender: 'AI家校沟通助手',
    message: '本周学习反馈已整理，可直接发送给家长确认。',
    tone: '高情商',
    relatedLessonId: 'lesson_001',
    createdAt: '2026-06-12T08:00:00.000Z'
  }
];

export const organizations = [
  {
    name: 'Aggie速记英语本部',
    plan: '标准版',
    planMode: '年付',
    students: 326,
    teachers: 14,
    limitStudents: 500,
    limitTeachers: 20,
    aiUsed: 7840,
    aiLimit: 10000,
    expires: '2027-06-04',
    status: '正常',
    expiryAction: '到期转只读，保留历史'
  },
  {
    name: '青禾英语工作室',
    plan: '体验版',
    planMode: '试用',
    students: 28,
    teachers: 2,
    limitStudents: 50,
    limitTeachers: 3,
    aiUsed: 120,
    aiLimit: 300,
    expires: '2026-06-18',
    status: '试用中',
    expiryAction: '到期后冻结 + 提示开通'
  },
  {
    name: '启航中考英语',
    plan: '基础版',
    planMode: '月付',
    students: 89,
    teachers: 5,
    limitStudents: 100,
    limitTeachers: 5,
    aiUsed: 1980,
    aiLimit: 2000,
    expires: '2026-06-01',
    status: '已到期',
    expiryAction: '到期后只读'
  }
];

export const billingPlans = [
  {
    name: '体验版',
    priceMonthly: '免费',
    priceYearly: '免费',
    period: '试用14天',
    desc: '适合新机构体验核心流程',
    features: ['50名学员', '3名老师', 'AI 300次/月', '到期只读/冻结策略']
  },
  {
    name: '基础版',
    priceMonthly: '¥399',
    priceYearly: '¥3990',
    period: '月付 / 年付',
    desc: '小工作室和起步机构',
    features: ['100名学员', '5名老师', 'AI 2,000次/月', '课时收费管理']
  },
  {
    name: '标准版',
    priceMonthly: '¥699',
    priceYearly: '¥6990',
    period: '月付 / 年付',
    desc: '100-500名学员机构',
    featured: true,
    features: ['500名学员', '20名老师', 'AI 10,000次/月', '续费风险预警']
  },
  {
    name: '专业版',
    priceMonthly: '¥1299',
    priceYearly: '¥12990',
    period: '月付 / 年付',
    desc: '多老师、多校区机构',
    features: ['2000名学员', '80名老师', 'AI 50,000次/月', '多校区权限']
  }
];

export const aiAgents = [
  {
    name: '星探官',
    for: '招生咨询',
    desc: '识别家长需求、孩子年级和薄弱点，自动推荐课程和跟进话术。',
    mode: '预览',
    icon: Sparkles
  },
  {
    name: '星守官',
    for: '续费预警',
    desc: '结合课时余额、反馈频率、作业表现和家长情绪，提前发现流失风险。',
    mode: '预览',
    icon: ShieldAlert
  },
  {
    name: '星语官',
    for: '家校沟通',
    desc: '把老师的课堂记录转成高情商反馈文本，避免表达偏差。',
    mode: '预览',
    icon: MessageCircleHeart
  },
  {
    name: '星练官',
    for: '练习生成',
    desc: '按年级、教材、题型和难度生成练习、错题变式、单词默写表。',
    mode: '预览',
    icon: WandSparkles
  },
  {
    name: '星账官',
    for: '课时收费',
    desc: '跟踪缴费、消课、欠费、续费和老师课时，减少账目混乱。',
    mode: '预览',
    icon: CreditCard
  },
  {
    name: '星路官',
    for: '成长路径',
    desc: '为小学一年级到高三学生生成阶段目标、弱项诊断与学习路线。',
    mode: '预览',
    icon: BookOpenCheck
  },
  {
    name: '掌舵官',
    for: '经营分析',
    desc: '把收入、续报、老师质量、线索转化做成创始人易懂的经营雷达。',
    mode: '预览',
    icon: TrendingUp
  },
  {
    name: '平台官',
    for: '平台运营',
    desc: '管理机构试用、套餐到期、用量限制和数据隔离状态。',
    mode: '预览',
    icon: Bot
  }
];

const admissionsMediaAssets = [
  {
    id: 'middle-exam-cram',
    placement: 'admissions',
    kind: 'photo',
    category: 'middle-exam',
    badge: '中考提分',
    title: '中考英语冲刺',
    summary: '暑假提分窗口期，围绕词汇、语法、阅读做集中突破。',
    description: '暑假提分窗口期，围绕词汇、语法、阅读做集中突破。',
    tags: ['词汇', '语法', '阅读', '冲刺'],
    mediaUrl: '/assets/admissions/middle-exam-cram.png',
    coverUrl: '/assets/admissions/middle-exam-cram.png',
    src: '/assets/admissions/middle-exam-cram.png',
    status: '已发布',
    sortOrder: 10
  },
  {
    id: 'primary-junior-transition',
    placement: 'admissions',
    kind: 'photo',
    category: 'transition',
    badge: '小升初衔接',
    title: '小升初英语衔接',
    summary: '从小学到初中，先把词汇量、语法体系和阅读节奏接起来。',
    description: '从小学到初中，先把词汇量、语法体系和阅读节奏接起来。',
    tags: ['衔接期', '体系化', '阅读', '听说'],
    mediaUrl: '/assets/admissions/primary-junior-transition.png',
    coverUrl: '/assets/admissions/primary-junior-transition.png',
    src: '/assets/admissions/primary-junior-transition.png',
    status: '已发布',
    sortOrder: 20
  },
  {
    id: 'in-school-new-concept',
    placement: 'admissions',
    kind: 'photo',
    category: 'in-school',
    badge: '同步提优',
    title: '课内英语衔接 + 新概念提优',
    summary: '课内不掉队，同时把新概念英语做成可持续提优路径。',
    description: '课内不掉队，同时把新概念英语做成可持续提优路径。',
    tags: ['课内同步', '新概念', '提优', '进阶'],
    mediaUrl: '/assets/admissions/in-school-new-concept.png',
    coverUrl: '/assets/admissions/in-school-new-concept.png',
    src: '/assets/admissions/in-school-new-concept.png',
    status: '已发布',
    sortOrder: 30
  },
  {
    id: 'phonics-ipa',
    placement: 'admissions',
    kind: 'photo',
    category: 'foundation',
    badge: '基础能力',
    title: '自然拼读 + 国际音标',
    summary: '用音标和拼读打底，帮孩子建立见词能读、听音能拼的能力。',
    description: '用音标和拼读打底，帮孩子建立见词能读、听音能拼的能力。',
    tags: ['自然拼读', '音标', '拼读', '开口'],
    mediaUrl: '/assets/admissions/phonics-ipa.png',
    coverUrl: '/assets/admissions/phonics-ipa.png',
    src: '/assets/admissions/phonics-ipa.png',
    status: '已发布',
    sortOrder: 40
  }
];

const cultureWallMediaAssets = [
  {
    id: 'v-101',
    placement: 'culture-wall',
    kind: 'video',
    title: '高一语法冲刺直播课',
    description: '围绕高一总复习阶段的关键时态复盘，家长和学生可一并回看。',
    summary: '围绕高一总复习阶段的关键时态复盘，家长和学生可一并回看。',
    date: '2026-06-02',
    uploader: '王老师',
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=900&q=80',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
    duration: '08:16',
    status: '已发布',
    sortOrder: 110,
    tags: ['课堂视频', '语法', '复盘']
  },
  {
    id: 'v-102',
    placement: 'culture-wall',
    kind: 'video',
    title: '小升初阅读训练营',
    description: '展示课前预习、课堂互动与错题复盘流程。',
    summary: '展示课前预习、课堂互动与错题复盘流程。',
    date: '2026-05-31',
    uploader: '林老师',
    mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    coverUrl: 'https://images.unsplash.com/photo-1606326608606-7ea6fce8f6f8?auto=format&fit=crop&w=900&q=80',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: '12:10',
    status: '已发布',
    sortOrder: 120,
    tags: ['课堂视频', '阅读', '训练营']
  },
  {
    id: 'p-201',
    placement: 'culture-wall',
    kind: 'photo',
    title: '期中阶段展示课',
    description: '学员分组活动与口语展示',
    summary: '学员分组活动与口语展示',
    date: '2026-06-01',
    uploader: '项目运营组',
    mediaUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    status: '已发布',
    sortOrder: 130,
    tags: ['课堂照片', '展示课']
  },
  {
    id: 'p-202',
    placement: 'culture-wall',
    kind: 'photo',
    title: 'AI作业批改课堂',
    description: '老师一对一点评 + 全班引导练习',
    summary: '老师一对一点评 + 全班引导练习',
    date: '2026-05-30',
    uploader: '王老师',
    mediaUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
    src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80',
    status: '已发布',
    sortOrder: 140,
    tags: ['课堂照片', 'AI批改']
  }
];

export const mediaLibrary = {
  assets: [...admissionsMediaAssets, ...cultureWallMediaAssets]
};

const cultureWallTeachers = [
  {
    id: 't-301',
    name: '王老师',
    title: '小学英语主教',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=450&q=80',
    highlights: ['AI备课效率提升 38%', '3小时内完成5份课堂复盘']
  },
  {
    id: 't-302',
    name: '李老师',
    title: '初高中英语专培',
    avatar:
      'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=450&q=80',
    highlights: ['课后反馈提交率 100%', '家长满意度 4.8/5']
  },
  {
    id: 't-303',
    name: '林老师',
    title: '阅读与写作负责人',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=450&q=80',
    highlights: ['月度提分 27%', '错题复习闭环覆盖 95%']
  }
];

const cultureWallFeedback = [
  {
    id: 'f-401',
    role: '家长反馈',
    author: '张女士（五年级）',
    text: '孩子的学习节奏清楚了，不会再因为没反馈找不到方向。'
  },
  {
    id: 'f-402',
    role: '学生反馈',
    author: '小宇（五年级）',
    text: '老师讲的句型例子很像日常对话，记忆起来快多了。'
  },
  {
    id: 'f-403',
    role: '家长反馈',
    author: '赵主任（机构）',
    text: '平台把课后反馈和续费线索自动归类后，我们能更快排优先级。'
  }
];

export const cultureWall = {
  videos: mediaLibrary.assets.filter((item) => item.placement === 'culture-wall' && item.kind === 'video').map((item) => ({ ...item })),
  photos: mediaLibrary.assets.filter((item) => item.placement === 'culture-wall' && item.kind === 'photo').map((item) => ({ ...item })),
  teachers: cultureWallTeachers.map((item) => ({ ...item })),
  feedback: cultureWallFeedback.map((item) => ({ ...item }))
};
