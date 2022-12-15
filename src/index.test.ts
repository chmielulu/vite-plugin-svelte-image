import svelteImages from "./index";
import * as path from "path";
import { hashID } from "./utils";

const image =
  path.join(process.cwd(), "src", "assets", "test.jpg") +
  "?quality=80&width=1920&placeholder=tracedSvg";
const testObj = svelteImages();

(async () => {
  // @ts-ignore
  await testObj.load(image);

  // @ts-ignore
  await testObj.load(image);

  // @ts-ignore
  await testObj.load(image);
})();
