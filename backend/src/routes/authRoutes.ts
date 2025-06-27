import express from 'express';
import { register, login, registerValidation, loginValidation } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

export default router;