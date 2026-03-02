import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.IMAGEKITCLOUD_NAME,
  api_key: process.env.IMAGEKIT_PRIVATE_KEY,
  api_secret: process.env.IMAGEKIT_API_SECRET
});

export default cloudinary;