export const CULTURE_WALL_UPLOAD_RULES = {
  photo: {
    label: '图片',
    maxBytes: 12 * 1024 * 1024
  },
  video: {
    label: '视频',
    maxBytes: 120 * 1024 * 1024
  }
};

export function formatUploadBytes(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function validateCultureWallUpload(kind, file) {
  const rule = CULTURE_WALL_UPLOAD_RULES[kind];
  if (!rule) {
    return '素材类型不支持';
  }

  const mimeType = `${file?.type || ''}`.toLowerCase();
  const size = Number(file?.size || 0);

  if (!file || typeof file.arrayBuffer !== 'function') {
    return '未选择可上传的文件';
  }

  if (kind === 'photo' && !mimeType.startsWith('image/')) {
    return '图片只能上传 image 类型文件';
  }

  if (kind === 'video' && !mimeType.startsWith('video/')) {
    return '视频只能上传 video 类型文件';
  }

  if (size <= 0) {
    return '文件大小不能为 0';
  }

  if (size > rule.maxBytes) {
    return `${rule.label}大小不能超过 ${formatUploadBytes(rule.maxBytes)}`;
  }

  return '';
}

function normalizeWallItems(items = [], kind) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    kind,
    ...(kind === 'video' ? { status: item.status || '已上传' } : {})
  }));
}

export function normalizeCultureWallSnapshot(data = {}) {
  return {
    videos: normalizeWallItems(data.videos || [], 'video'),
    photos: normalizeWallItems(data.photos || [], 'photo'),
    teachers: (Array.isArray(data.teachers) ? data.teachers : []).map((item) => ({ ...item })),
    feedbacks: (Array.isArray(data.feedback) ? data.feedback : []).map((item) => ({ ...item }))
  };
}
