    import express from 'express';
    import {
    createCourse,
    getCoursesByMaster,
    getCourseById,
    updateCourse,
    deleteCourse,
    getAllCourses,
    } from '../controllers/courseController.js';
    // import { upload } from '../config/cloudinary.js';
    import { protectMaster } from '../middleware/authMiddleware.js';
    import upload from '../middleware/upload.js';

    const router = express.Router();

    // Apply auth middleware to all routes
    router.use(protectMaster);

    // Routes
    router.post('/create', upload.single('bannerImage'), createCourse);
    router.get('/master/:masterId', getCoursesByMaster);
    router.get('/all', getAllCourses);
    router.get('/:id', getCourseById);
    router.put('/:id', upload.single('bannerImage'), updateCourse);
    router.delete('/:id', deleteCourse);

    export default router;