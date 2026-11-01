import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const r = Router();
r.post('/register', c.register);
r.post('/login', c.login);
r.post('/logout', authenticate, c.logout);
export default r;