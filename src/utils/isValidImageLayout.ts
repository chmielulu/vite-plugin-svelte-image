export const isValidImageLayout = (layout?: string): boolean =>
  layout == "constrained" || layout === "fixed" || layout === "fullWidth";
