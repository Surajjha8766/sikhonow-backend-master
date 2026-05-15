import express from 'express';

import {
  createCourse,
  getCoursesByMaster,
  getCourseById,
  updateCourse,
  deleteCourse,
  getAllCourses,
  getCoursesByCategory,
} from '../controllers/courseController.js';

import { protectMaster } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();


// ================= PUBLIC ROUTES =================

// ALL COURSES
router.get('/all', getAllCourses);

// SINGLE COURSE
router.get('/:id', getCourseById);

// CATEGORY COURSES
router.get('/category/:category', getCoursesByCategory);


// ================= PROTECTED ROUTES =================

router.post(
  '/create',
  protectMaster,
  upload.single('bannerImage'),
  createCourse
);

router.get(
  '/master/:masterId',
  protectMaster,
  getCoursesByMaster
);

router.put(
  '/:id',
  protectMaster,
  upload.single('bannerImage'),
  updateCourse
);

router.delete(
  '/:id',
  protectMaster,
  deleteCourse
);

export default router;