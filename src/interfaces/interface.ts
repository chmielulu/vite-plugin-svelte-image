import { Sharp } from "sharp";

export type Format = "auto" | "webp" | "jpeg" | "png" | "avif";

export interface FormatOptions {
  progressive?: boolean;
  quality: number;
}

export type ImageLayout = "constrained" | "fixed" | "fullWidth";
export type ImagePlaceholder =
  | "dominantColor"
  | "blurred"
  | "tracedSvg"
  | "none";
export type ImageFit = "cover" | "contain" | "fill" | "inside" | "outside";
export type ImageCropFocus = "cover" | "entropy" | "attention";

export interface ImageArgs {
  layout?: ImageLayout;
  width?: number;
  height?: number;
  aspectRatio?: number;
  placeholder?: ImagePlaceholder;
  formats?: Format | Format[];
  transformOptions?: {
    grayscale?: boolean;
    duotone?: boolean;
    rotate?: number;
    trim?: number;
    cropFocus?: ImageCropFocus;
    fit?: ImageFit;
  };
  sizes?: string;
  quality?: number;
  outputPixelDensities?: number[];
  breakpoints?: number[];
}

export interface FilledImageArgs extends ImageArgs {
  layout: ImageLayout;
  placeholder: ImagePlaceholder;
  formats: Format[];
  transformOptions: {
    fit: ImageFit;
    cropFocus: ImageCropFocus;
  };
  quality: number;
  breakpoints: number[];
  ignore: boolean;
}

export interface PluginArgs {
  defaultArgs?: ImageArgs;
  outDir?: string;
  tracedSvg?: {
    background?: string;
    color?: string;
  };
  imagesDownloader?: () => Promise<{ items: { id: string; href: string }[] }>;
}

export interface TransformedImage {
  layout: ImageLayout;
  backgroundColor?: string;
  placeholder?: {
    fallback: string;
  };
  images: TransformedImageImages;
  width: number;
  height: number;
}

export interface TransformedImageImages {
  fallback: {
    source: Sharp;
    width: number;
    sources: { source: Sharp; width: number }[];
  };
  sources: { format: Format; images: { source: Sharp; width: number }[] }[];
}

export interface SvelteImage {
  layout: ImageLayout;
  backgroundColor?: string;
  placeholder?: {
    fallback: string;
  };
  width: number;
  height: number;
  images: {
    fallback: {
      src: string;
      srcSet: string;
      sizes: string;
    };
    sources: {
      srcSet: string;
      type: string;
      sizes: string;
    }[];
  };
}
