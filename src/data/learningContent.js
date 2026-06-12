import {
  BookOpenCheck,
  Headphones,
  MessageCircleHeart,
  Mic,
  Puzzle,
  Star,
  WandSparkles
} from 'lucide-react';

export const PRACTICE_MODULES = [
  {
    id: 'words',
    title: '单词星球',
    desc: '看图记词 + 发音模仿',
    note: '适合每天 8 分钟',
    icon: Star
  },
  {
    id: 'reading',
    title: '阅读任务',
    desc: '故事阅读 + 线索查找',
    note: '读完即可获得积分',
    icon: BookOpenCheck
  },
  {
    id: 'speaking',
    title: '口语小剧场',
    desc: '跟读表达 + 情景对话',
    note: '每次练 3 句就够',
    icon: MessageCircleHeart
  },
  {
    id: 'grammar',
    title: '语法拼图',
    desc: '把句子变成会搭积木的规则',
    note: '一题一反馈',
    icon: WandSparkles
  }
];

export const ACHIEVEMENT_ITEMS = [
  { id: 'a1', title: '连学小太阳', note: '连续打卡 7 天', icon: Star },
  { id: 'a2', title: '阅读闪光章', note: '本周完成 3 篇阅读', icon: BookOpenCheck },
  { id: 'a3', title: '表达勇气章', note: '开口表达 12 次', icon: MessageCircleHeart }
];

export const COURSE_PATH_STEPS = [
  {
    id: 'warmup',
    title: '热身听读',
    desc: '跟读 6 个关键词，建立声音记忆。',
    status: 'done',
    reward: '+20 星星'
  },
  {
    id: 'story',
    title: '故事阅读',
    desc: '读一段小故事，找出主旨和线索。',
    status: 'active',
    reward: '+35 星星'
  },
  {
    id: 'grammar',
    title: '语法拼图',
    desc: '把句子部件拖到正确位置。',
    status: 'open',
    reward: '+25 星星'
  },
  {
    id: 'show',
    title: '口语展示',
    desc: '录 3 句表达，生成课堂成长片段。',
    status: 'locked',
    reward: '完成前置后解锁'
  }
];

export const COURSE_SKILL_GOALS = [
  { id: 'vocabulary', title: '词汇', value: 82, icon: Star },
  { id: 'reading', title: '阅读', value: 76, icon: BookOpenCheck },
  { id: 'grammar', title: '语法', value: 68, icon: Puzzle },
  { id: 'speaking', title: '口语', value: 71, icon: Mic }
];

export const PRACTICE_ARENAS = [
  {
    id: 'vocab',
    title: '单词泡泡',
    desc: '听发音，点正确图片',
    icon: Headphones,
    level: 'Level 3',
    energy: 78,
    prompt: 'apple / elephant / classroom',
    actions: ['听一遍', '选图片', '拼单词']
  },
  {
    id: 'grammar',
    title: '语法拼图',
    desc: '把句子拼成正确顺序',
    icon: Puzzle,
    level: 'Level 4',
    energy: 64,
    prompt: 'I went to school yesterday.',
    actions: ['看提示', '拖拼图', '检查答案']
  },
  {
    id: 'speaking',
    title: '口语小剧场',
    desc: '跟读并完成情景表达',
    icon: Mic,
    level: 'Level 2',
    energy: 56,
    prompt: 'Can I have some water?',
    actions: ['听示范', '开始跟读', '保存录音']
  }
];

export const PROFILE_SKILL_RADAR = [
  { id: 'listen', title: '听力', value: 80, color: '#86D5FF' },
  { id: 'speak', title: '口语', value: 74, color: '#FF9BB3' },
  { id: 'read', title: '阅读', value: 76, color: '#98E8C3' },
  { id: 'grammar', title: '语法', value: 68, color: '#FFE370' }
];

export const WEEKLY_STREAK = [
  { id: 'mon', label: '一', done: true },
  { id: 'tue', label: '二', done: true },
  { id: 'wed', label: '三', done: true },
  { id: 'thu', label: '四', done: false },
  { id: 'fri', label: '五', done: false },
  { id: 'sat', label: '六', done: false },
  { id: 'sun', label: '日', done: false }
];
