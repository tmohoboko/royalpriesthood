import { next } from '@vercel/functions';
import { callbackBoundary } from './server/callback-policy.js';
export default function proxy(request) {
  return callbackBoundary(request) || next();
}
