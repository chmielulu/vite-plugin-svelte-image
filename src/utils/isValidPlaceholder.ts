export const isValidPlaceholder = (placeholder?: string): boolean =>
  placeholder === "dominantColor" ||
  placeholder === "blurred" ||
  placeholder === "none" ||
  placeholder === "tracedSvg";
