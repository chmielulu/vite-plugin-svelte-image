import { ImageArgs, SvelteImage } from "./interface";
import * as fs from "fs";
import path from "path";

interface Image {
  filename: string;
  args: ImageArgs;
  outputData: any;
}

const CACHE_PATHNAME = path.join(process.cwd(), ".cache");
const SVELTE_CACHE_PATHNAME = path.join(CACHE_PATHNAME, "svelte-image");
export class ImagesCache {
  private cachedImages: Map<string, SvelteImage>;
  constructor() {
    fs.mkdirSync(CACHE_PATHNAME, { recursive: true });

    if (fs.existsSync(SVELTE_CACHE_PATHNAME)) {
      const data = fs.readFileSync(SVELTE_CACHE_PATHNAME, "utf-8");
      this.cachedImages = new Map(Object.entries(JSON.parse(data)));
    } else {
      this.cachedImages = new Map();
    }
  }

  async push(id: string, image: SvelteImage) {
    this.cachedImages.set(id, image);
    await fs.promises.writeFile(
      SVELTE_CACHE_PATHNAME,
      JSON.stringify(Object.fromEntries(this.cachedImages)),
      { encoding: "utf-8" }
    );
  }

  get(id: string) {
    return this.cachedImages.get(id);
  }
}
