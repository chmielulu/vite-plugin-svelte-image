import { PluginArgs, SvelteImage } from "./interfaces/interface";
import * as fs from "fs";
import JSum from "jsum";
import { PATH_CACHE_DIR, PATH_CACHE_FILE } from "./constants/constants";

export class PluginCache {
  private cachedImages: Map<string, SvelteImage>;
  private pluginArgsChecksum: any;

  constructor(pluginArgs: PluginArgs) {
    const newChecksum = JSum.digest(pluginArgs, "SHA256", "hex");

    fs.mkdirSync(PATH_CACHE_DIR, { recursive: true });
    if (fs.existsSync(PATH_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(PATH_CACHE_FILE, "utf-8"));

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
      PATH_CACHE_FILE,
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
