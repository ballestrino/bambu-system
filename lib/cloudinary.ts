import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadBase64Image(
  base64: string,
  folder = process.env.CLOUDINARY_FOLDER ?? "bambu/chat"
): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: "image",
    })
    return result.secure_url
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return null
  }
}
