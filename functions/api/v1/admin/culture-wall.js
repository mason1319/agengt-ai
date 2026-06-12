import {
  jsonResponse,
  parseAuthContext
} from '../_shared/runtimeData.js';
import {
  deleteCultureWallAsset,
  fetchCultureWallAssetById,
  fetchCultureWallAssetsByInstitution,
  insertCultureWallAssetUnsafe
} from '../_shared/dbLayer.js';

const ALLOWED_ROLES_FOR_WRITE = ['platform', 'founder'];
const ALLOWED_ROLES_FOR_READ = ['platform', 'founder', 'teacher', 'parent', 'student'];
const resolveR2 = (env = {}) => env?.ASSETS || env?.STAR_MATE_ASSETS;

function r2UnavailableErrorMessage() {
  return 'R2 bucket not bound. Please configure wrangler r2_buckets ASSETS or STAR_MATE_ASSETS.';
}

function randomId(prefix = 'cw') {
  const rand = `${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${Date.now()}_${rand}`;
}

function extractExtFromName(name = '', contentType = '') {
  const cleanName = `${name || ''}`;
  const dot = cleanName.lastIndexOf('.');
  if (dot >= 0 && dot < cleanName.length - 1) {
    return cleanName.slice(dot).toLowerCase();
  }

  if (contentType === 'video/mp4') {
    return '.mp4';
  }
  if (contentType === 'image/jpeg') {
    return '.jpg';
  }
  if (contentType === 'image/png') {
    return '.png';
  }

  return '';
}

function pickInstitutionId(context, role = 'founder') {
  const query = new URL(context.request.url);
  const institutionId = `${query.searchParams.get('institutionId') || ''}`.trim();

  if (institutionId) {
    return institutionId;
  }

  return context.user?.institutionId || (role === 'platform' ? 'inst-star' : 'inst-star');
}

function allowedToWrite(role = '') {
  return ALLOWED_ROLES_FOR_WRITE.includes(role);
}

async function listAssets(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const kind = `${url.searchParams.get('kind') || ''}`.trim();
  const mediaKey = `${url.searchParams.get('mediaKey') || ''}`.trim();
  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';
  const mergedContext = {
    ...context,
    ...(auth || {}),
    institutionId: auth?.institutionId || auth?.user?.institutionId,
    user: auth?.user
  };

  if (!mediaKey && !env?.DB) {
    return jsonResponse(
      { success: false, error: 'D1 未绑定，文化墙无法读取。' },
      500
    );
  }

  if (mediaKey) {
    const r2Bucket = resolveR2(env);
    if (!r2Bucket) {
      return jsonResponse({ success: false, error: 'R2 bucket not bound' }, 500);
    }
    const object = await r2Bucket.get(mediaKey);
    if (!object) {
      return jsonResponse({ success: false, error: '媒体文件不存在' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  const institutionId = pickInstitutionId(mergedContext, role);
  const wall = await fetchCultureWallAssetsByInstitution(env.DB, institutionId, kind);

  return jsonResponse({
    success: true,
    total: (wall?.videos || []).length + (wall?.photos || []).length + (wall?.teachers || []).length + (wall?.feedback || []).length,
    data: {
      cultureWall: wall
    }
  });
}

async function uploadAssets(context) {
  const { request, env } = context;
  const auth = await parseAuthContext(request, env);
  const role = auth?.role || '';
  const requestId = `cw-${Math.random().toString(36).slice(2, 10)}`;

  if (!allowedToWrite(role)) {
    return jsonResponse({ success: false, error: 'Only founder/platform can upload culture wall assets' }, 403);
  }

  if (!env?.DB) {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const r2Bucket = resolveR2(env);
  if (!r2Bucket) {
    return jsonResponse(
      {
        success: false,
        error: r2UnavailableErrorMessage()
      },
      500
    );
  }

  const isMultipart = /^multipart\//i.test((request.headers.get('content-type') || '').trim());
  const mergedContext = {
    ...context,
    ...(auth || {})
  };
  const institutionId = pickInstitutionId(mergedContext, role);

  if (isMultipart) {
    const form = await request.formData();
    const kind = `${form.get('kind') || 'photo'}`.trim();

    if (!['video', 'photo', 'teacher', 'feedback'].includes(kind)) {
      return jsonResponse({ success: false, error: 'kind must be video/photo/teacher/feedback' }, 400);
    }

    if (kind === 'video' || kind === 'photo') {
      const file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function') {
        return jsonResponse({ success: false, error: '未提供上传文件' }, 400);
      }

      const ext = extractExtFromName(file.name, file.type);
      const assetId = randomId(kind);
      const key = `culture-wall/${institutionId}/${kind}/${assetId}${ext}`;
      const data = await file.arrayBuffer();
      await r2Bucket.put(key, data, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream'
        }
      });

      const mediaUrl = `${new URL(request.url).origin}/api/v1/admin/culture-wall?mediaKey=${encodeURIComponent(key)}`;
      try {
        const saved = await insertCultureWallAssetUnsafe(env.DB, {
          id: assetId,
          institutionId,
          kind,
          title: `${form.get('title') || file.name}`,
          description: `${form.get('description') || ''}`,
          uploader: `${form.get('uploader') || '平台管理员'}`,
          mediaKey: key,
          mediaUrl,
          coverUrl: kind === 'video' ? mediaUrl : '',
          duration: kind === 'video' ? `${form.get('duration') || '--:--'}` : '',
          status: `${form.get('status') || '已发布'}`,
          extra: {
            originalName: `${file.name || ''}`,
            mimeType: `${file.type || 'application/octet-stream'}`,
            size: Number(file.size || 0)
          }
        });

        if (!saved) {
          return jsonResponse({ success: false, error: '保存素材失败' }, 500);
        }
      } catch (error) {
        try {
          await r2Bucket.delete(key);
        } catch {
          // rollback cleanup failure should not mask original DB issue
        }
        console.error('[culture-wall] upload failed', {
          requestId,
          kind,
          institutionId,
          key,
          error: `${error?.message || error}`
        });
        return jsonResponse(
          {
            success: false,
            error: `保存素材失败：${error?.message || '数据库写入异常'}`
          },
          500
        );
      }

      const wall = await fetchCultureWallAssetsByInstitution(env.DB, institutionId);
      return jsonResponse({ success: true, data: { cultureWall: wall } });
    }

    return jsonResponse({ success: false, error: '不支持的素材类型' }, 400);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.kind || !['teacher', 'feedback'].includes(`${body.kind}`.trim())) {
    return jsonResponse({ success: false, error: '请求格式错误' }, 400);
  }

  const kind = `${body.kind}`.trim();
  const title = `${body.title || ''}`.trim();
  const description = `${body.description || ''}`.trim();

  try {
    const saved = await insertCultureWallAssetUnsafe(env.DB, {
      id: randomId(kind),
      institutionId,
      kind,
      title,
      description,
      uploader: `${body.uploader || '平台管理员'}`,
      status: `${body.status || '已发布'}`,
      extra: {
        text: `${body.text || ''}`
      }
    });

    if (!saved) {
      return jsonResponse({ success: false, error: '保存素材失败' }, 500);
    }
    } catch (error) {
    console.error('[culture-wall] upload failed', {
      requestId,
      kind,
      institutionId,
      error: `${error?.message || error}`
    });
    return jsonResponse(
      {
        success: false,
        error: `保存素材失败：${error?.message || '数据库写入异常'}`
      },
      500
    );
  }

  const wall = await fetchCultureWallAssetsByInstitution(env.DB, institutionId);
  return jsonResponse({ success: true, data: { cultureWall: wall } });
}

async function deleteAsset(context) {
  const { request, env } = context;
  const auth = await parseAuthContext(request, env);
  const role = auth?.role || '';

  if (!allowedToWrite(role)) {
    return jsonResponse({ success: false, error: 'Only founder/platform can delete culture wall assets' }, 403);
  }

  if (!env?.DB) {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const url = new URL(request.url);
  const requestId = `${url.searchParams.get('id') || ''}`.trim();

  let payload = {};
  if (!requestId) {
    payload = await request.json().catch(() => ({}));
  }

  const assetId = `${requestId || payload?.id || ''}`.trim();
  if (!assetId) {
    return jsonResponse({ success: false, error: 'asset id required' }, 400);
  }

  const institutionId = pickInstitutionId({ ...(auth || {}), ...context }, role);
  const row = await fetchCultureWallAssetById(env.DB, institutionId, assetId);
  const deleted = await deleteCultureWallAsset(env.DB, institutionId, assetId);

  if (!deleted) {
    return jsonResponse({ success: false, error: '删除失败，素材不存在' }, 404);
  }

  const existingR2 = resolveR2(env);
  if (row?.media_key && existingR2) {
    await existingR2.delete(row.media_key);
  }

  const wall = await fetchCultureWallAssetsByInstitution(env.DB, institutionId);
  return jsonResponse({ success: true, data: { cultureWall: wall } });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  if (!auth?.role || !auth?.user?.id) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const role = auth.role;
  if (!ALLOWED_ROLES_FOR_READ.includes(role)) {
    return jsonResponse({ success: false, error: 'No permission' }, 403);
  }

  if (request.method === 'GET') {
    return listAssets({ ...context, role, user: auth?.user, institutionId: auth?.user?.institutionId, userId: auth?.user?.id });
  }

  if (request.method === 'POST') {
    return uploadAssets(context);
  }

  if (request.method === 'DELETE') {
    return deleteAsset(context);
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
