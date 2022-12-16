import { PluginArgs, SvelteImage } from "./interface";
import * as fs from "fs";
import path from "path";
import JSum from "jsum";

const CACHE_PATHNAME = path.join(process.cwd(), ".cache");
const SVELTE_CACHE_PATHNAME = path.join(CACHE_PATHNAME, "svelte-image");
export class ImagesCache {
  private cachedImages: Map<string, SvelteImage>;
  private pluginArgsChecksum: any;

  constructor(pluginArgs: PluginArgs) {
    const newChecksum = JSum.digest(pluginArgs, "SHA256", "hex");

    fs.mkdirSync(CACHE_PATHNAME, { recursive: true });
    if (fs.existsSync(SVELTE_CACHE_PATHNAME)) {
      const data = JSON.parse(fs.readFileSync(SVELTE_CACHE_PATHNAME, "utf-8"));

      if (data.pluginArgsChecksum !== newChecksum) {
        this.cachedImages = new Map();
        this.pluginArgsChecksum = newChecksum;
      } else {
        this.cachedImages = new Map(Object.entries(data.cachedImages));
        this.pluginArgsChecksum = data.pluginArgsChecksum;
      }
    } else {
      this.cachedImages = new Map();
      this.pluginArgsChecksum = newChecksum;
    }
  }

  async push(id: string, image: SvelteImage) {
    this.cachedImages.set(id, image);
    await fs.promises.writeFile(
      SVELTE_CACHE_PATHNAME,
      JSON.stringify({
        cachedImages: Object.fromEntries(this.cachedImages),
        pluginArgsChecksum: this.pluginArgsChecksum,
      }),
      { encoding: "utf-8" }
    );
  }

  get(id: string) {
    return this.cachedImages.get(id);
  }
}
