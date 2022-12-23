import type { Plugin } from "vite";
import { PluginArgs } from "./interfaces/interface";
import { PluginSvelteImage } from "./plugin";

export function VitePluginSvelteImage(args: PluginArgs = {}): Plugin {
  const plugin = new PluginSvelteImage(args);

  return {
    name: "svelte-image",
    enforce: "pre",
    resolveId: plugin.resolveId.bind(plugin),
    load: plugin.generateSvelteImage.bind(plugin),
  };
}

// // @ts-ignore
// export { default as Image } from "./components/Image.svelte";
