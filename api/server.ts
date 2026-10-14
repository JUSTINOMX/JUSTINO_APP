// @ts-ignore
import app from './_server.mjs';

export default function handler(req: any, res: any) {
  // 1. Resolve requested URL accurately in all Vercel runtime modes
  let targetUrl = req.url || '';

  // If Vercel rewrote URL to /api/server or /, extract the actual route
  if (!targetUrl || targetUrl.startsWith('/api/server') || targetUrl === '/') {
    // Check query parameter _route passed from vercel.json rewrite
    const urlObj = typeof req.url === 'string' && req.url.includes('?') ? new URL(req.url, 'http://localhost') : null;
    const queryRoute = req.query?._route || (urlObj ? urlObj.searchParams.get('_route') : null);
    
    if (queryRoute) {
      if (queryRoute === 'blog' || queryRoute.startsWith('blog/') || queryRoute === 'sitemap.xml' || queryRoute === 'robots.txt') {
        targetUrl = `/${queryRoute}`;
      } else {
        targetUrl = `/api/${String(queryRoute).replace(/^\/+/, '')}`;
      }
    } else {
      const fallback = req.headers?.['x-original-url'] || req.headers?.['x-forwarded-uri'];
      if (fallback && typeof fallback === 'string' && !fallback.startsWith('/api/server')) {
        targetUrl = fallback;
      }
    }
  }

  // Restore query string if stripped, but preserve clean path for Express routing
  if (targetUrl && !targetUrl.startsWith('/api/server')) {
    req.url = targetUrl;
  }

  // 2. Ensure socket and connection exist for serverless environments (prevents remoteAddress crashes)
  if (!req.socket) {
    const forwarded = req.headers?.['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || '127.0.0.1';
    req.socket = { remoteAddress: ip };
  } else if (!req.socket.remoteAddress) {
    req.socket.remoteAddress = '127.0.0.1';
  }
  if (!req.connection) {
    req.connection = req.socket;
  }

  return app(req, res);
}
