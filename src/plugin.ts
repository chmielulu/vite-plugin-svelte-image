import { PluginCache } from "./cache";
import {
  FilledImageArgs,
  Format,
  PluginArgs,
  TransformedImage,
  TransformedImageImages,
} from "./interfaces/interface";
import { dataToEsm } from "@rollup/pluginutils";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import util from "util";
import { trace } from "potrace";
import { isSupportedImage } from "./utils/isSupportedImage";
import { hashID } from "./utils/hashId";
import { extractInfoFromId } from "./utils/ extractInfoFromId";
import { getAbsoluteImagePath } from "./utils/getAbsoluteImagePath";
import { getSizes } from "./utils/getSizes";
import { getSrcSet } from "./utils/getSrcSet";
import { getDominantColor } from "./utils/getDominantColor";
import { optimizeSVG } from "./utils/optimizeSvg";
import { transformFallback } from "./utils/transformFallback";
import colors from "colors/safe";

export class PluginSvelteImage {
  private cache: PluginCache;
  private pluginArs: PluginArgs;

  constructor(pluginArgs: PluginArgs) {
    this.cache = new PluginCache(pluginArgs);
    this.pluginArs = pluginArgs;
  }

  async generateSvelteImage(id: string) {
    const info = extractInfoFromId(id);

    if (!info) {
      return;
    }

    const { params, filename } = info;

    if (!isSupportedImage(id) || params.ignore) {
      return;
    }

    const foundedSvelteImages = this.cache.get(hashID(id));

    if (foundedSvelteImages) {
      return dataToEsm(foundedSvelteImages);
    }

    const image = sharp(filename);
    let transformedImage: TransformedImage;

    try {
      switch (params.layout) {
        case "constrained":
          transformedImage = await this.transformToConstrained(
            image,
            params,
            this.pluginArs
          );
          break;
      }
    } catch (e) {
      console.log(colors.bgRed("vite-plugin-svelte-image"));
      console.log(colors.bgRed("File:"), colors.red(id));
      console.log(colors.bgRed("Error:"), colors.red(e));
      process.exit(1);
    }

    let readyObj = {
      layout: transformedImage.layout,
      width: transformedImage.width,
      height: transformedImage.height,
      ...(transformedImage.backgroundColor
        ? { backgroundColor: transformedImage.backgroundColor }
        : { placeholder: transformedImage.placeholder }),
      images: {
        fallback: {
          src: "",
          srcSet: "",
          sizes: "",
        },
        sources: [],
      },
    };

    const svelteImageId = hashID(id);
    const svelteImagePath = path.join(
      process.cwd(),
      this.pluginArs?.outDir || "static",
      "svelte-image",
      svelteImageId
    );
    await fs.promises.mkdir(svelteImagePath, { recursive: true });

    const fallbackImageId = crypto.randomUUID();

    const fallbackImageFormat = (await image.metadata()).format as Format;
    const mainFallbackImagePath = path.join(
      svelteImagePath,
      `${fallbackImageId}.${fallbackImageFormat}`
    );

    await transformedImage.images.fallback.source.toFile(mainFallbackImagePath);

    readyObj.images.fallback.src = getAbsoluteImagePath(mainFallbackImagePath);
    readyObj.images.fallback.sizes = getSizes(
      transformedImage.images.fallback.width
    );

    readyObj.images.fallback.srcSet = await getSrcSet(
      transformedImage.images.fallback.sources,
      fallbackImageFormat,
      svelteImagePath
    );

    for await (const { format, images } of transformedImage.images.sources) {
      let svelteImageSource = {
        type: "",
        sizes: "",
        srcSet: "",
      };
      svelteImageSource.type = `image/${format}`;

      const theBiggestWidth = Math.max(...images.map((image) => image.width));
      svelteImageSource.sizes = getSizes(theBiggestWidth);

      svelteImageSource.srcSet = await getSrcSet(
        images,
        format,
        svelteImagePath
      );
      readyObj.images.sources = [...readyObj.images.sources, svelteImageSource];
    }

    await this.cache.push(svelteImageId, readyObj);

    return dataToEsm(readyObj);
  }

  private async transformToConstrained(
    image: sharp.Sharp,
    params: FilledImageArgs,
    args: PluginArgs
  ): Promise<TransformedImage> {
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("internal error");
    }

    let width: number, height: number;

    if (params.width && params.width < metadata.width) {
      width = params.width;
    } else {
      width = metadata.width;
    }

    if (params.height && params.height < metadata.height) {
      height = params.height;
    } else {
      height =
        width < metadata.width
          ? Math.round(metadata.height * (width / metadata.height))
          : metadata.height;
    }

    let imageObj: TransformedImage = {
      layout: "constrained",
      images: {
        fallback: undefined,
        sources: [],
      },
      width,
      height,
    };

    if (params.placeholder === "dominantColor") {
      imageObj.backgroundColor = await getDominantColor(image);
    } else if (params.placeholder === "blurred") {
      imageObj.placeholder = {
        fallback: `data:image/png;base64,${(
          await image.clone().resize(20).withMetadata().png().toBuffer()
        ).toString("base64")}`,
      };
    } else if (params.placeholder === "tracedSvg") {
      const tracePromise = util.promisify(trace);
      const placeholderBuffer = await image
        .clone()
        .resize(400)
        .withMetadata()
        [metadata.format]({ quality: 50 })
        .toBuffer();
      // @ts-ignore
      const svg = (await tracePromise(placeholderBuffer, {
        background: args?.tracedSvg?.background || "transparent",
        color: args?.tracedSvg?.color,
      })) as string;

      imageObj.placeholder = {
        fallback: optimizeSVG(svg),
      };
    }

    let images: TransformedImageImages = {
      sources: [],
      fallback: {
        width: 0,
        sources: [],
        source: image,
      },
    };

    const imageSizes = [0, 0, 0, 0].map((_, i) =>
      Math.round((width / 4) * (i + 1))
    );

    let fallback = {
      source: transformFallback(image, metadata, params, width),
      sources: [],
      width,
    };

    if (params.formats.includes("auto")) {
      for (const imageSize of imageSizes) {
        fallback.sources = [
          ...fallback.sources,
          {
            source: transformFallback(image, metadata, params, imageSize),
            width: imageSize,
          },
        ];
      }
    }

    images.fallback = fallback;

    for (const format of params.formats.filter((format) => format !== "auto")) {
      let source = {
        format,
        images: [],
      };

      if (format === "auto") return;
      for (const imageSize of imageSizes) {
        source.images = [
          ...source.images,
          {
            source: image
              .clone()
              [format]({ quality: params.quality })
              .resize(imageSize, null, {
                fit: params.transformOptions.fit,
              })
              .withMetadata(),
            width: imageSize,
          },
        ];
      }

      images.sources = [...images.sources, source];
    }

    imageObj.images = images as TransformedImageImages;

    return imageObj;
  }
}
