import { createHandler } from "../server/handler.js";
import { createNodeAdapter } from "../server/node-adapter.js";
export default createNodeAdapter(createHandler());
