export const isValidFormat = (format?: string): boolean =>
  format === "auto" ||
  format === "webp" ||
  format === "avif" ||
  format === "jpeg" ||
  format === "png";
