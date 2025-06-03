import express from "express";
import { postUser } from "../controller/authController.js";
import { loginUser, logoutUser, getUserProfile } from "../controller/authController.js";
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Use proper route paths
router.post("/signup", postUser);
router.post("/login", loginUser);
router.post('/logout', logoutUser);
router.get('/profile', verifyToken, getUserProfile); 
export default router;
