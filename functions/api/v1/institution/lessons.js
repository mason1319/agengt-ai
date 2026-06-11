import {
  consumeLessonAccount,
  ensureLessonAccountEnough,
  fetchLessons,
  fetchLessonById,
  insertLesson,
  updateLesson,
  fetchStudentById
} from '../_shared/dbLayer.js';
import { jsonResponse, parseAuthContext } from '../_shared/runtimeData.js';

const STR = (value) => `${value || ''}`.trim();

function resolveInstitutionId(auth, url, explicit) {
  const parsed = new URL(url);
  const queryId = STR(parsed.searchParams.get('institutionId'));
  return STR(explicit) || queryId || STR(auth?.user?.institutionId);
}

function normalizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  const auth = await parseAuthContext(request, env);
  const role = auth?.role || 'founder';

  if (!env?.DB && request.method !== 'GET') {
    return jsonResponse(
      {
        success: false,
        error: 'D1 database not bound. Please configure wrangler d1_databases DB.'
      },
      500
    );
  }

  const parsed = new URL(request.url);
  const institutionId = resolveInstitutionId(auth, request.url, parsed.searchParams.get('institutionId'));

  if (!institutionId && ['platform', 'founder', 'teacher', 'parent', 'student'].includes(role)) {
    return jsonResponse({ success: false, error: 'institutionId required' }, 400);
  }

  if (request.method === 'GET') {
    const lessonId = STR(parsed.searchParams.get('lessonId'));
    const filter = {
      institutionId,
      limit: normalizeNumber(parsed.searchParams.get('limit'), 50),
      offset: Math.max(0, normalizeNumber(parsed.searchParams.get('offset'), 0)),
      status: STR(parsed.searchParams.get('status')),
      studentId: STR(parsed.searchParams.get('studentId')),
      teacherId: STR(parsed.searchParams.get('teacherId'))
    };

    if (role === 'teacher' && !auth?.user?.id) {
      return jsonResponse({ success: false, error: 'Teacher identity required' }, 401);
    }

    if (role === 'parent' || role === 'student') {
      const ownerStudentId = STR(auth?.user?.childId || auth?.user?.studentId);
      if (!ownerStudentId) {
        return jsonResponse({ success: false, error: 'Current user has no bound student' }, 400);
      }
      if (filter.studentId && filter.studentId !== ownerStudentId) {
        return jsonResponse({ success: false, error: 'No permission for this student' }, 403);
      }
      filter.studentId = ownerStudentId;
    }

    if (role === 'teacher') {
      const teacherStudentId = filter.studentId || STR(parsed.searchParams.get('targetStudentId'));
      if (teacherStudentId) {
        const student = await fetchStudentById(env.DB, institutionId, teacherStudentId);
        if (!student || STR(student.teacherId) !== STR(auth?.user?.id)) {
          return jsonResponse({ success: false, error: 'No permission for this student' }, 403);
        }
      }
      filter.teacherId = auth?.user?.id;
    }

    if (lessonId) {
      const lesson = await fetchLessonById(env.DB, lessonId, institutionId);
      if (!lesson) {
        return jsonResponse({ success: false, error: 'lesson not found' }, 404);
      }

      if (role === 'teacher' && STR(lesson.teacherId) !== STR(auth?.user?.id)) {
        return jsonResponse({ success: false, error: 'No permission' }, 403);
      }

      if ((role === 'parent' || role === 'student') && STR(lesson.studentId) !== STR(auth?.user?.childId || auth?.user?.studentId)) {
        return jsonResponse({ success: false, error: 'No permission' }, 403);
      }

      return jsonResponse({
        success: true,
        data: {
          lesson
        }
      });
    }

    const lessons = await fetchLessons(env.DB, filter);
    const items = Array.isArray(lessons?.items) ? lessons.items : [];
    return jsonResponse({
      success: true,
      total: lessons?.total || 0,
      data: {
        lessons: items,
        limit: lessons?.limit || 0,
        offset: lessons?.offset || 0,
        nextOffset: lessons?.nextOffset || 0
      }
    });
  }

  if (request.method === 'POST') {
    if (!['platform', 'founder', 'teacher'].includes(role)) {
      return jsonResponse({ success: false, error: 'No permission' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const studentId = STR(payload.studentId);
    const teacherId = role === 'teacher' ? STR(auth?.user?.id) : STR(payload.teacherId);
    const status = STR(payload.status || 'completed');
    const topic = STR(payload.topic || '课程');
    const hoursUsed = Math.max(1, Math.round(Number(payload.hoursUsed || 1)));
    const teacherNote = STR(payload.teacherNote);
    const parentFeedback = STR(payload.parentFeedback);

    if (!studentId || !teacherId) {
      return jsonResponse({ success: false, error: 'studentId and teacherId are required' }, 400);
    }

    const student = await fetchStudentById(env.DB, institutionId, studentId);
    if (!student) {
      return jsonResponse({ success: false, error: 'Student not found' }, 404);
    }

    if (role === 'teacher' && STR(student.teacherId) !== STR(auth?.user?.id)) {
      return jsonResponse({ success: false, error: 'No permission for this student' }, 403);
    }

    if (payload.autoConsumeHours !== false) {
      const enough = await ensureLessonAccountEnough(env.DB, studentId, hoursUsed);
      if (!enough?.ok) {
        return jsonResponse(
          {
            success: false,
            error: `课时不足: ${enough?.reason || 'unknown'}`
          },
          409
        );
      }
    }

    const inserted = await insertLesson(env.DB, {
      institutionId,
      studentId,
      teacherId,
      topic,
      status,
      hoursUsed,
      teacherNote,
      parentFeedback
    });

    if (!inserted || !inserted.id) {
      return jsonResponse({ success: false, error: 'Create lesson failed' }, 500);
    }

    const account = await ensureLessonAccountEnough(env.DB, studentId, hoursUsed);
    if (payload.autoConsumeHours !== false && account?.ok && account?.account?.id) {
      await consumeLessonAccount(env.DB, studentId, account.account.id, hoursUsed);
    }

    const lesson = await fetchLessonById(env.DB, inserted.id, institutionId);
    return jsonResponse({
      success: true,
      data: {
        lesson
      }
    });
  }

  if (request.method === 'PATCH') {
    if (!['platform', 'founder', 'teacher'].includes(role)) {
      return jsonResponse({ success: false, error: 'No permission' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const lessonId = STR(payload.id || parsed.searchParams.get('lessonId'));
    if (!lessonId) {
      return jsonResponse({ success: false, error: 'lessonId required' }, 400);
    }

    const current = await fetchLessonById(env.DB, lessonId, institutionId);
    if (!current) {
      return jsonResponse({ success: false, error: 'lesson not found' }, 404);
    }

    if (role === 'teacher') {
      if (STR(current.teacherId) !== STR(auth?.user?.id)) {
        return jsonResponse({ success: false, error: 'No permission to edit this lesson' }, 403);
      }
    }

    const updates = {};
    if (payload.status !== undefined) {
      updates.status = STR(payload.status);
    }
    if (payload.teacherNote !== undefined) {
      updates.teacherNote = STR(payload.teacherNote);
    }
    if (payload.parentFeedback !== undefined) {
      updates.parentFeedback = STR(payload.parentFeedback);
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ success: false, error: 'No fields to update' }, 400);
    }

    const ok = await updateLesson(env.DB, lessonId, institutionId, updates);
    if (!ok) {
      return jsonResponse({ success: false, error: 'Update failed' }, 500);
    }

    const lesson = await fetchLessonById(env.DB, lessonId, institutionId);
    return jsonResponse({
      success: true,
      data: {
        lesson
      }
    });
  }

  return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
}
