import { FilledImageArgs, Format, ImageArgs } from "./interface";
import { Metadata, Sharp } from "sharp";
import camelcase from "camelcase";
import * as crypto from "crypto";
import path from "path";
import { optimize } from "svgo";

export const isImage = (pathname: string) => {
  const filename = pathname.split("?")[0];

  return (
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".png") ||
    filename.endsWith(".gif") ||
    filename.endsWith("webp")
  );
};

export const extractId = (
  id: string
): { params: FilledImageArgs; filename: string } => {
  const urlString = `file://${id}`;

  const url = new URL(urlString);

  let obj: FilledImageArgs = {
    layout: "constrained",
    placeholder: "dominantColor",
    formats: ["auto", "webp"],
    transformOptions: { fit: "cover", cropFocus: "attention" },
    quality: 50,
    breakpoints: [750, 1080, 1366, 1920],
  };

  url.searchParams.forEach((v, k) => {
    const kToNum = parseInt(v);
    // @ts-ignore
    obj[camelcase(k)] = !isNaN(kToNum) ? kToNum : camelcase(v);
  });

  if (obj.layout === "constrained" || obj.layout === "fullWidth") {
    obj["outputPixelDensities"] = [0.25, 0.5, 1, 2];
  } else {
    obj["outputPixelDensities"] = [1, 2];
  }

  if (!isValidImageLayout(obj.layout)) {
    throw new Error(`Invalid image layout: ${obj.layout}`);
  }

  if (!isValidPlaceholder(obj.placeholder)) {
    throw new Error(`Invalid image placeholder: ${obj.placeholder}`);
  }

  if (Array.isArray(obj.formats)) {
    obj.formats = obj.formats.map((format) => {
      if (!isValidFormat(format)) {
        throw new Error(
          `You passed invalid format! This plugin does not support ${obj.formats}`
        );
      }

      // @ts-ignore
      return format === "jpg" ? "jpeg" : format;
    });
  } else if (typeof obj.formats === "string") {
    if (!isValidFormat(obj.formats)) {
      throw new Error(
        `You passed invalid format! This plugin does not support ${obj.formats}`
      );
    }

    obj.formats = [obj.formats === "jpg" ? "jpeg" : obj.formats];
  }

  const filename = url.href.replace(url.search, "").replace("file://", "");
  return { params: obj, filename };
};

export const isValidFormat = (format?: string): boolean =>
  format === "auto" ||
  format === "webp" ||
  format === "avif" ||
  format === "jpeg" ||
  format === "png";

export const isValidPlaceholder = (placeholder?: string): boolean =>
  placeholder === "dominantColor" ||
  placeholder === "blurred" ||
  placeholder === "none" ||
  placeholder === "tracedSvg";

export const isValidImageLayout = (layout?: string): boolean =>
  layout == "constrained" || layout === "fixed" || layout === "fullWidth";

export const getDominantColor = async (image: Sharp) => {
  const {
    dominant: { r, g, b },
  } = await image.stats();

  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
};

export const hashID = (id: string): string =>
  crypto.createHash("sha256").update(id).digest("base64url");

export const transformFallback = (
  image: Sharp,
  metadata: Metadata,
  params: ImageArgs,
  width: number
) => {
  switch (metadata.format) {
    case "jpg":
    case "jpeg":
      return image.clone().resize(width).jpeg({ quality: params.quality });
    case "png":
      return image.clone().resize(width).png({ quality: params.quality });
    case "webp":
      return image.clone().resize(width).webp({ quality: params.quality });
    case "avif":
      return image.clone().resize(width).webp({ quality: params.quality });
    default:
      throw new Error(`Unsupported image format: ${metadata.format}`);
  }
};

export const getFilename = (path: string) =>
  path.replace(process.cwd(), "").replace("/static", "");
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

    srcSets.push(`${getFilename(sourceImagePath)} ${image.width}w`);
  }

  return srcSets.join(", \n");
};

export const getSizes = (width: number) =>
  `(min-width: ${width}px) ${width}w, 100vw`;

export const optimizeSVG = (svg: string) =>
  optimize(svg, { multipass: true, floatPrecision: 0, datauri: "base64" }).data;
