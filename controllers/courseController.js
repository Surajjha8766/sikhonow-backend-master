// controllers/courseController.js
import Course from '../models/Course.js';
import { cloudinary } from '../config/cloudinary.js';
import { 
  createBunnyVideo, 
  getBunnyVideo, 
  deleteBunnyVideo,
  getVideoEmbedUrl,
  // getVideoHlsUrl 
} from '../config/bunny.js';

// Create new course with chapters
export const createCourse = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    let { 
      title, 
      description, 
      durationValue, 
      durationUnit,
      originalPrice,
      offerPrice,
      category, 
      language, 
      uploadedBy, 
      masterId,
      chapters,
      previewVideo
    } = req.body;
    
    // Parse chapters if sent as string
    if (chapters && typeof chapters === 'string') {
      chapters = JSON.parse(chapters);
    }
    
    // Parse previewVideo if sent as string
    if (previewVideo && typeof previewVideo === 'string') {
      previewVideo = JSON.parse(previewVideo);
    }
    
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

    // Process chapters - create videos in Bunny.net
    let processedChapters = [];
    if (chapters && chapters.length > 0) {
      for (const chapter of chapters) {
        if (chapter.video && chapter.video.videoId) {
          // Get video info from Bunny
          const videoInfo = await getBunnyVideo(chapter.video.videoId);
          
          processedChapters.push({
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            video: {
              videoId: chapter.video.videoId,
              url: getVideoEmbedUrl(chapter.video.videoId),
              thumbnailUrl: chapter.video.thumbnailUrl || `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${chapter.video.videoId}/thumbnail.jpg`,
              length: videoInfo.length || chapter.video.length || '00:00:00',
              size: videoInfo.size || 0,
            }
          });
        }
      }
    }

    // Process preview video if provided
    let processedPreviewVideo = null;
    if (previewVideo && previewVideo.videoId) {
      const videoInfo = await getBunnyVideo(previewVideo.videoId);
      processedPreviewVideo = {
        videoId: previewVideo.videoId,
        url: getVideoEmbedUrl(previewVideo.videoId),
        thumbnailUrl: previewVideo.thumbnailUrl || `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${previewVideo.videoId}/thumbnail.jpg`,
        length: videoInfo.length || previewVideo.length || '00:00:00',
      };
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
      previewVideo: processedPreviewVideo,
      chapters: processedChapters,
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

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };
    
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    
    // Parse chapters if sent as string
    if (updates.chapters && typeof updates.chapters === 'string') {
      updates.chapters = JSON.parse(updates.chapters);
    }
    
    // Parse previewVideo if sent as string
    if (updates.previewVideo && typeof updates.previewVideo === 'string') {
      updates.previewVideo = JSON.parse(updates.previewVideo);
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
    
    // Handle chapters update with video URLs
    if (updates.chapters && Array.isArray(updates.chapters)) {
      const processedChapters = [];
      for (const chapter of updates.chapters) {
        if (chapter.video && chapter.video.videoId) {
          const videoInfo = await getBunnyVideo(chapter.video.videoId);
          processedChapters.push({
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            video: {
              videoId: chapter.video.videoId,
              url: getVideoEmbedUrl(chapter.video.videoId),
              thumbnailUrl: `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${chapter.video.videoId}/thumbnail.jpg`,
              length: videoInfo.length || chapter.video.length || '00:00:00',
              size: videoInfo.size || 0,
            }
          });
        } else {
          processedChapters.push(chapter);
        }
      }
      updates.chapters = processedChapters;
    }
    
    // Handle preview video update
    if (updates.previewVideo && updates.previewVideo.videoId) {
      const videoInfo = await getBunnyVideo(updates.previewVideo.videoId);
      updates.previewVideo = {
        videoId: updates.previewVideo.videoId,
        url: getVideoEmbedUrl(updates.previewVideo.videoId),
        thumbnailUrl: `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${updates.previewVideo.videoId}/thumbnail.jpg`,
        length: videoInfo.length || updates.previewVideo.length || '00:00:00',
      };
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
    
    // Delete videos from Bunny.net
    if (course.previewVideo && course.previewVideo.videoId) {
      try {
        await deleteBunnyVideo(course.previewVideo.videoId);
      } catch (error) {
        console.error('Failed to delete preview video:', error);
      }
    }
    
    for (const chapter of course.chapters) {
      if (chapter.video && chapter.video.videoId) {
        try {
          await deleteBunnyVideo(chapter.video.videoId);
        } catch (error) {
          console.error(`Failed to delete chapter video ${chapter.video.videoId}:`, error);
        }
      }
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

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      totalCourses: courses.length,
      courses,
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const courses = await Course.find({
      category: category,
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      totalCourses: courses.length,
      courses,
    });
  } catch (error) {
    console.error('Category course error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const uploadVideoToBunny = async (
  file,
  title,
  type,
  chapterIndex = null
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const uploadId = `${type}-${chapterIndex || "preview"}`;

      setUploadStatus((prev) => ({
        ...prev,
        [uploadId]: "creating",
      }));

      // STEP 1 - CREATE VIDEO
      const createResponse = await axios.post(
        `${API}/bunny/create-video`,
        {
          title,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "masterToken"
            )}`,
          },
        }
      );

      if (!createResponse.data.success) {
        throw new Error("Failed to create Bunny video");
      }

      const { videoId, uploadUrl } = createResponse.data;

      setUploadStatus((prev) => ({
        ...prev,
        [uploadId]: "uploading",
      }));

      // STEP 2 - UPLOAD VIDEO TO BUNNY
      await axios.put(uploadUrl, file, {
        headers: {
          AccessKey: import.meta.env.VITE_BUNNY_API_KEY,
          "Content-Type": "application/octet-stream",
        },

        maxBodyLength: Infinity,
        maxContentLength: Infinity,

        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          setUploadProgress((prev) => ({
            ...prev,
            [videoId]: percentCompleted,
          }));
        },
      });

      setUploadStatus((prev) => ({
        ...prev,
        [uploadId]: "processing",
      }));

      // WAIT FOR PROCESSING
      await new Promise((resolve) =>
        setTimeout(resolve, 5000)
      );

      // STEP 3 - GET VIDEO INFO
      const videoInfoResponse = await axios.get(
        `${API}/bunny/video/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "masterToken"
            )}`,
          },
        }
      );

      setUploadStatus((prev) => ({
        ...prev,
        [uploadId]: "completed",
      }));

      resolve({
        videoId,
        url: videoInfoResponse.data.videoUrl,
        thumbnailUrl:
          videoInfoResponse.data.thumbnailUrl,
        length:
          videoInfoResponse.data.length ||
          "00:00:00",
      });
    } catch (error) {
      console.error("VIDEO UPLOAD ERROR:", error);

      reject(
        new Error(
          error.response?.data?.message ||
            error.message ||
            "Video upload failed"
        )
      );
    }
  });
};