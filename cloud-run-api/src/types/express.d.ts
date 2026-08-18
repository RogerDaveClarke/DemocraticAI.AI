import { User } from './types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}