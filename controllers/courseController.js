import Course from '../models/Course.js';
import { cloudinary } from '../config/cloudinary.js';

// Create new course
export const createCourse = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { 
      title, 
      description, 
      durationValue, 
      durationUnit,
      originalPrice,
      offerPrice,
      category, 
      language, 
      uploadedBy, 
      masterId 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !durationValue || !durationUnit || !originalPrice || !offerPrice || !category || !language || !uploadedBy || !masterId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        missingFields: {
          title: !title,
          description: !description,
          durationValue: !durationValue,
          durationUnit: !durationUnit,
          originalPrice: !originalPrice,
          offerPrice: !offerPrice,
          category: !category,
          language: !language,
          uploadedBy: !uploadedBy,
          masterId: !masterId,
        }
      });
    }
    
    // Check if banner image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required',
      });
    }

    // Validate pricing
    const originalPriceNum = Number(originalPrice);
    const offerPriceNum = Number(offerPrice);
    
    if (isNaN(originalPriceNum) || isNaN(offerPriceNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price values',
      });
    }
    
    if (offerPriceNum > originalPriceNum) {
      return res.status(400).json({
        success: false,
        message: 'Offer price cannot be greater than original price',
      });
    }

    // Create course
    const course = new Course({
      title,
      description,
      duration: {
        value: Number(durationValue),
        unit: durationUnit,
      },
      pricing: {
        originalPrice: originalPriceNum,
        offerPrice: offerPriceNum,
      },
      bannerImage: {
        url: req.file.path,
        publicId: req.file.filename,
      },
      category,
      language,
      uploadedBy,
      masterId,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    console.error('Create course error details:', error);
    
    // Handle Cloudinary specific errors
    if (error.message.includes('api_key')) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration error. Please check API keys.',
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Get all courses for a master
export const getCoursesByMaster = async (req, res) => {
  try {
    const { masterId } = req.params;
    
    const courses = await Course.find({ masterId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single course
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    // If new banner image uploaded, delete old one from cloudinary
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(course.bannerImage.publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
      
      updates.bannerImage = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }
    
    // Handle duration update
    if (updates.durationValue && updates.durationUnit) {
      updates.duration = {
        value: Number(updates.durationValue),
        unit: updates.durationUnit,
      };
      delete updates.durationValue;
      delete updates.durationUnit;
    }
    
    // Handle pricing update
    if (updates.originalPrice && updates.offerPrice) {
      updates.pricing = {
        originalPrice: Number(updates.originalPrice),
        offerPrice: Number(updates.offerPrice),
      };
      delete updates.originalPrice;
      delete updates.offerPrice;
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    // Delete banner from cloudinary
    try {
      await cloudinary.uploader.destroy(course.bannerImage.publicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
    }
    
    await Course.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};