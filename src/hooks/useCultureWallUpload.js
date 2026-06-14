import { useEffect, useRef, useState } from 'react';
import { CULTURE_WALL_UPLOAD_RULES, validateCultureWallUpload } from '../utils/cultureWallUpload';

export function useCultureWallUpload({
  canEdit = false,
  onUploadAsset,
  onAction
} = {}) {
  const pendingUploadRef = useRef(null);
  const uploadResetTimerRef = useRef(null);
  const [uploadTask, setUploadTask] = useState(null);

  useEffect(() => () => {
    if (uploadResetTimerRef.current) {
      clearTimeout(uploadResetTimerRef.current);
      uploadResetTimerRef.current = null;
    }
  }, []);

  const resetUploadTask = () => {
    if (uploadResetTimerRef.current) {
      clearTimeout(uploadResetTimerRef.current);
      uploadResetTimerRef.current = null;
    }
    setUploadTask(null);
    pendingUploadRef.current = null;
  };

  const updateUploadProgress = (progress) => {
    setUploadTask((current) => {
      if (!current || current.status !== 'uploading') {
        return current;
      }

      return {
        ...current,
        progress: Math.max(current.progress || 0, Math.min(99, progress))
      };
    });
  };

  const submitUpload = async ({ kind, file, controlId, onSuccess }) => {
    const validationMessage = validateCultureWallUpload(kind, file);
    const rule = CULTURE_WALL_UPLOAD_RULES[kind];
    const fallbackLabel = rule?.label || '素材';

    if (validationMessage) {
      pendingUploadRef.current = null;
      setUploadTask({
        kind,
        fileName: file?.name || '未知文件',
        fileSize: file?.size || 0,
        label: fallbackLabel,
        progress: 0,
        status: 'error',
        canRetry: false,
        message: validationMessage
      });
      onAction?.(controlId, `上传失败：${validationMessage}`);
      return false;
    }

    pendingUploadRef.current = { kind, file };
    setUploadTask({
      kind,
      fileName: file.name,
      fileSize: file.size || 0,
      label: fallbackLabel,
      progress: 0,
      status: 'uploading',
      canRetry: false,
      message: `正在上传${fallbackLabel}：${file.name}`
    });
    onAction?.(controlId, `开始上传：${kind === 'photo' ? '图片素材' : '教学视频'}（${file.name}）`);

    if (typeof onUploadAsset !== 'function') {
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: fallbackLabel,
        progress: 0,
        status: 'error',
        canRetry: true,
        message: '上传失败：上传服务暂不可用'
      });
      onAction?.(controlId, '上传失败：上传服务暂不可用');
      return false;
    }

    try {
      const nextWall = await onUploadAsset({
        kind,
        file,
        uploader: '当前管理员',
        onProgress: ({ progress }) => updateUploadProgress(progress || 0)
      });

      if (typeof onSuccess === 'function') {
        onSuccess(nextWall);
      }

      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: fallbackLabel,
        progress: 100,
        status: 'success',
        canRetry: false,
        message: `上传完成：${file.name}`
      });
      onAction?.(controlId, nextWall ? `上传完成：${file.name}` : '上传完成：本次未返回同步数据');

      if (uploadResetTimerRef.current) {
        clearTimeout(uploadResetTimerRef.current);
      }
      uploadResetTimerRef.current = setTimeout(() => {
        if (pendingUploadRef.current?.file === file) {
          resetUploadTask();
        }
      }, 1400);
      return true;
    } catch (error) {
      const message = error?.message || '请求失败';
      setUploadTask({
        kind,
        fileName: file.name,
        fileSize: file.size || 0,
        label: fallbackLabel,
        progress: 0,
        status: 'error',
        canRetry: true,
        message: `上传失败：${message}`
      });
      onAction?.(controlId, `上传失败：${message}`);
      return false;
    }
  };

  const retryUpload = async ({ controlId, onSuccess } = {}) => {
    const pending = pendingUploadRef.current;
    if (!pending || !canEdit) {
      return false;
    }

    return await submitUpload({
      kind: pending.kind,
      file: pending.file,
      controlId: controlId || (pending.kind === 'photo' ? 'culture-wall.prepare-upload-photo' : 'culture-wall.prepare-upload-video'),
      onSuccess
    });
  };

  const createUploadChangeHandler = ({ kind, controlId, onSuccess } = {}) => async (evt) => {
    const file = evt.target.files?.[0];
    if (!file || !canEdit) {
      if (file && !canEdit) {
        onAction?.(controlId, '当前账号无权限上传');
      }
      evt.target.value = '';
      return false;
    }

    const result = await submitUpload({ kind, file, controlId, onSuccess });
    evt.target.value = '';
    return result;
  };

  return {
    uploadTask,
    resetUploadTask,
    retryUpload,
    createUploadChangeHandler
  };
}
