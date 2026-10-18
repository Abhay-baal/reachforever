const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function uploadImage(buffer, folder = "reachforever/results") {
  if (!isConfigured()) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

function uploadVideo(buffer, folder = "reachforever/results/videos") {
  if (!isConfigured()) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
        allowed_formats: ["mp4", "webm", "mov"],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

async function deleteVideo(publicId) {
  if (!publicId) return;
  if (!isConfigured()) {
    throw new Error("Cannot delete the Cloudinary video: configuration is missing.");
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary video deletion returned: ${result.result}`);
  }
}

async function deleteImage(publicId) {
  if (!publicId) return;
  if (!isConfigured()) {
    throw new Error("Cannot delete the Cloudinary image: configuration is missing.");
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion returned: ${result.result}`);
  }
}

module.exports = { cloudinary, isConfigured, uploadImage, uploadVideo, deleteImage, deleteVideo };
