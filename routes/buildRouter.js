import express from 'express';
import { createBuild, getBuilds } from '../controllers/buildController.js';

const router = express.Router();

router.post('/', createBuild);
router.get('/', getBuilds);

export default router;