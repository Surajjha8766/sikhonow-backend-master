import express from "express";

import {
  createBunnyVideo,
  getBunnyVideo,
  getVideoEmbedUrl,
  getVideoThumbnail,
} from "../config/bunny.js";

const router = express.Router();

// CREATE VIDEO
router.post("/create-video", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const video = await createBunnyVideo(title);

    const uploadUrl = `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${video.guid}`;

    res.status(200).json({
      success: true,
      videoId: video.guid,
      uploadUrl,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET VIDEO
router.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await getBunnyVideo(videoId);

    res.status(200).json({
      success: true,
      videoId: video.guid,
      title: video.title,
      status: video.status,
      length: video.length,

      thumbnailUrl: getVideoThumbnail(videoId),

      videoUrl: getVideoEmbedUrl(videoId),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// routes/bunnyRoutes.js - Add delete endpoint
// Delete video from Bunny.net
router.delete('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    await deleteBunnyVideo(videoId);
    
    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;