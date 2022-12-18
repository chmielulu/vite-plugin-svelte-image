import { VitePluginSvelteImage } from "../";
import * as path from "path";

const image =
  path.join(process.cwd(), "src", "assets", "test.jpg") +
  "?quality=80&width=1920&placeholder=tracedSvg";
const testObj = VitePluginSvelteImage({});

(async () => {
  // @ts-ignore
  await testObj.load(image);
})();
