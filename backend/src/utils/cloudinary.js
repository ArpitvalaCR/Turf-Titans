import { v2 as cloudinary } from 'cloudinary';

const getCloudinaryConfig = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME.trim() : '';
  const api_key = process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.trim() : '';
  const api_secret = process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.trim() : '';

  const isConfigured = Boolean(
    cloud_name &&
    cloud_name !== 'your_cloudinary_cloud_name' &&
    api_key &&
    api_key !== 'your_cloudinary_api_key' &&
    api_secret &&
    api_secret !== 'your_cloudinary_api_secret'
  );

  return { cloud_name, api_key, api_secret, isConfigured };
};

export const uploadToCloudinary = (fileBuffer, options = {}) =>
  new Promise((resolve, reject) => {
    const config = getCloudinaryConfig();

    if (!config.isConfigured) {
      // Return a valid base64 data URI in local/mock environments
      const mime = options.resource_type === 'raw' || options.format === 'pdf' ? 'application/pdf' : 'image/png';
      const base64Str = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      return resolve({ secure_url: base64Str, public_id: `local-${Date.now()}` });
    }

    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    });

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
  const config = getCloudinaryConfig();
  if (!config.isConfigured) return null;

  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
  });

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
