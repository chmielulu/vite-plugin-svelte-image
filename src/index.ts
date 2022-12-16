import type { Plugin } from "vite";
import {
  isImage,
  extractId,
  getDominantColor,
  hashID,
  transformFallback,
  getSrcSet,
  getSizes,
  getFilename,
  optimizeSVG,
} from "./utils";
import sharp from "sharp";
import {
  FilledImageArgs,
  Format,
  PluginArgs,
  TransformedImage,
  TransformedImageImages,
} from "./interface";
import { ImagesCache } from "./cache";
import { dataToEsm } from "@rollup/pluginutils";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { trace } from "potrace";
import * as util from "util";

export default function VitePluginSvelteImages(args: PluginArgs = {}): Plugin {
  const generatedImages = new ImagesCache(args);

  return {
    name: "svelte-image",
    enforce: "pre",
    load: async (id: string) => {
      if (!isImage(id)) {
        return;
      }

      const foundedSvelteImages = generatedImages.get(hashID(id));

      if (foundedSvelteImages) {
        return dataToEsm(foundedSvelteImages);
      }

      const { params, filename } = extractId(id);

      const image = sharp(filename);

      let transformedImage: TransformedImage;

      try {
        switch (params.layout) {
          case "constrained":
            transformedImage = await transformToConstrained(
              image,
              params,
              args
            );
            break;
        }
      } catch (e) {
        throw e;
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
        args?.outDir || "static",
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

      await transformedImage.images.fallback.source.toFile(
        mainFallbackImagePath
      );

      readyObj.images.fallback.src = getFilename(mainFallbackImagePath);
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
        readyObj.images.sources = [
          ...readyObj.images.sources,
          svelteImageSource,
        ];
      }

      await generatedImages.push(svelteImageId, readyObj);

      return dataToEsm(readyObj);
    },
  };
}

const transformToConstrained = async (
  image: sharp.Sharp,
  params: FilledImageArgs,
  args: PluginArgs
): Promise<TransformedImage> => {
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
        ? Math.round(metadata.height * (width / metadata.width))
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
        await image.clone().resize(20).png().toBuffer()
      ).toString("base64")}`,
    };
  } else if (params.placeholder === "tracedSvg") {
    const tracePromise = util.promisify(trace);
    const placeholderBuffer = await image
      .clone()
      .resize(400)
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
    imageSizes.forEach((imageSize) => {
      fallback.sources = [
        ...fallback.sources,
        {
          source: transformFallback(image, metadata, params, imageSize),
          width: imageSize,
        },
      ];
    });
  }

  images.fallback = fallback;

  params.formats
    .filter((format) => format !== "auto")
    .forEach((format) => {
      let source = {
        format,
        images: [],
      };

      if (format === "auto") return;
      imageSizes.forEach((imageSize) => {
        source.images = [
          ...source.images,
          {
            source: image
              .clone()
              [format]({ quality: params.quality })
              .resize(imageSize, null, {
                fit: params.transformOptions.fit,
              }),
            width: imageSize,
          },
        ];
      });

      images.sources = [...images.sources, source];
    });

  imageObj.images = images as TransformedImageImages;

  return imageObj;
};
