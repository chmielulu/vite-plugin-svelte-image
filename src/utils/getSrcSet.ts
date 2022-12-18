import { Sharp } from "sharp";
import { Format } from "../interfaces/interface";
import crypto from "crypto";
import path from "path";
import { getAbsoluteImagePath } from "./getAbsoluteImagePath";

export const getSrcSet = async (
  images: { source: Sharp; width: number }[],
  format: Format,
  svelteImagePath
) => {
  let srcSets = [];

  for await (const image of images) {
    const sourceImageId = crypto.randomUUID();
    const sourceImagePath = path.join(
      svelteImagePath,
      `${sourceImageId}.${format}`
    );

    await image.source.toFile(sourceImagePath);

    srcSets.push(`${getAbsoluteImagePath(sourceImagePath)} ${image.width}w`);
  }

  return srcSets.join(", \n");
};
