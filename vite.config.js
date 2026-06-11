import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getMockRuntimeData } from './src/services/runtimeDataService.js';

const runtimeData = () => getMockRuntimeData();

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function handleDevApi(req, res) {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const pathname = requestUrl.pathname;
  const role = requestUrl.searchParams.get('role') || 'platform';
  const data = runtimeData();

  if (pathname === '/api/v1/bootstrap' && req.method === 'GET') {
    const courses = Array.isArray(data.teacherLessons) ? data.teacherLessons.slice() : [];
    return sendJson(res, 200, {
      success: true,
      source: 'api',
      meta: {
        modeLabel: '本地预览',
        aiProvider: 'mock',
        aiBaseUrl: '',
        aiModel: 'mock'
      },
      data: {
        ...data,
        courses,
        appMeta: {
          ...(data.appMeta || {}),
          source: 'api',
          modeLabel: '本地预览',
          aiProvider: 'mock',
          aiBaseUrl: '',
          aiModel: 'mock',
          appEnv: 'development'
        }
      }
    });
  }

  if (pathname === '/api/v1/public/courses' && req.method === 'GET') {
    const limit = Number(requestUrl.searchParams.get('limit') || 20);
    const courses = Array.isArray(data.teacherLessons) ? data.teacherLessons.slice(0, limit) : [];
    return sendJson(res, 200, {
      success: true,
      source: 'api',
      data: {
        courses,
        total: Array.isArray(data.teacherLessons) ? data.teacherLessons.length : 0
      }
    });
  }

  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    return sendJson(res, 200, {
      success: true,
      source: 'api',
      data: {
        token: `dev-${role}-${Date.now()}`,
        user: {
          id: `user-${role}`,
          role,
          name: role === 'platform' ? '平台管理员' : 'Aggie 学员'
        }
      }
    });
  }

  if (pathname === '/api/v1/me' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      source: 'api',
      data: {
        user: {
          id: `user-${role}`,
          role,
          name: role === 'platform' ? '平台管理员' : 'Aggie 学员'
        }
      }
    });
  }

  if (pathname === '/api/v1/admin/culture-wall' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      source: 'api',
      data: {
        cultureWall: data.cultureWall
      }
    });
  }

  return false;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'starmate-dev-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/api/v1/')) {
            next();
            return;
          }

          const handled = handleDevApi(req, res);
          if (!handled) {
            next();
          }
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
});
