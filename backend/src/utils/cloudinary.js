import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer, options = {}) =>
  new Promise((resolve, reject) => {
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key';

    if (!isCloudinaryConfigured) {
      // Return a valid base64 data URI in local/mock environments
      const mime = options.resource_type === 'raw' || options.format === 'pdf' ? 'application/pdf' : 'image/png';
      const base64Str = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      return resolve({ secure_url: base64Str, public_id: `local-${Date.now()}` });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'turf-titans',
        resource_type: options.resource_type || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
