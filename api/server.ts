// @ts-ignore
import app from './_server.mjs';

export default function handler(req: any, res: any) {
  // 1. Restore original requested URL if rewritten by Vercel router
  const originalPath = 
    req.headers?.['x-matched-path'] || 
    req.headers?.['x-invoke-path'] || 
    req.headers?.['x-forwarded-uri'] || 
    req.headers?.['x-original-url'];

  if (originalPath && typeof originalPath === 'string' && originalPath.startsWith('/api')) {
    req.url = originalPath;
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
