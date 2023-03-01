import { Metadata, Sharp } from "sharp";
import { ImageArgs } from "../interfaces/interface";

export const transformFallback = (
  image: Sharp,
  metadata: Metadata,
  params: ImageArgs,
  width: number
) => {
  switch (metadata.format) {
    case "jpg":
    case "jpeg":
      return image
        .clone()
        .resize(width)
        .withMetadata()
        .jpeg({ quality: params.quality });
    case "png":
      return image
        .clone()
        .resize(width)
        .withMetadata()
        .png({ quality: params.quality });
    case "webp":
      return image
        .clone()
        .resize(width)
        .withMetadata()
        .webp({ quality: params.quality });
    case "avif":
      return image
        .clone()
        .resize(width)
        .withMetadata()
        .webp({ quality: params.quality });
    default:
      throw new Error(`Unsupported image format: ${metadata.format}`);
  }
};
