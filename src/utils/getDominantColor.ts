import { Sharp } from "sharp";

export const getDominantColor = async (image: Sharp) => {
  const {
    dominant: { r, g, b },
  } = await image.stats();

  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
};
