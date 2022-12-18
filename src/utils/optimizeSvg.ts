import { optimize } from "svgo";

export const optimizeSVG = (svg: string) =>
  optimize(svg, { multipass: true, floatPrecision: 0, datauri: "base64" }).data;
