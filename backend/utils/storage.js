import fs from 'fs';
import path from 'path';

/**
 * Saves an uploaded file to storage.
 * Currently returns local static path for Render.
 * Can be easily swapped later with Cloudinary, AWS S3, etc.
 *
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Publicly accessible URL/path to the file
 */
export const saveFile = async (file) => {
  // Cloudinary placeholder configuration template:
  // import { v2 as cloudinary } from 'cloudinary';
  // const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto' });
  // return result.secure_url;

  return `/uploads/${file.filename}`;
};
