// @ts-ignore
import app from './_server.mjs';

export default function handler(req: any, res: any) {
  return app(req, res);
}
