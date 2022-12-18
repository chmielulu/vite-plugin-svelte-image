import { FilledImageArgs } from "../interfaces/interface";
import camelcase from "camelcase";
import { isValidImageLayout } from "./isValidImageLayout";
import { isValidPlaceholder } from "./isValidPlaceholder";
import { isValidFormat } from "./isValidFormat";

export const extractInfoFromId = (
  id: string
): { params: FilledImageArgs; filename: string } => {
  const urlString = `file://${id}`;

  let url: URL;

  try {
    url = new URL(urlString);
  } catch (e) {
    return;
  }

  let obj: FilledImageArgs = {
    layout: "constrained",
    placeholder: "dominantColor",
    formats: ["auto", "webp"],
    transformOptions: { fit: "cover", cropFocus: "attention" },
    quality: 50,
    breakpoints: [750, 1080, 1366, 1920],
    ignore: url.searchParams.has("ignore")
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
