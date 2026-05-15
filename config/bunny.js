import axios from "axios";

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;

const BUNNY_CDN_URL = "https://video.bunnycdn.com";

// CREATE VIDEO
export const createBunnyVideo = async (title) => {
  try {
    const response = await axios.post(
      `${BUNNY_CDN_URL}/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        title,
      },
      {
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Create Bunny Video Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to create Bunny video");
  }
};

// GET VIDEO INFO
export const getBunnyVideo = async (videoId) => {
  try {
    const response = await axios.get(
      `${BUNNY_CDN_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: BUNNY_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Get Bunny Video Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to get Bunny video");
  }
};

// DELETE VIDEO
export const deleteBunnyVideo = async (videoId) => {
  try {
    const response = await axios.delete(
      `${BUNNY_CDN_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: BUNNY_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Delete Bunny Video Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to delete Bunny video");
  }
};

// EMBED URL
export const getVideoEmbedUrl = (videoId) => {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
};

// THUMBNAIL URL
export const getVideoThumbnail = (videoId) => {
  return `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/thumbnail.jpg`;
};