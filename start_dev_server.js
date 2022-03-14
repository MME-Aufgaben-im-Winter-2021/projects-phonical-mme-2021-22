/* eslint-env node */

import "dotenv/config";
import express from "express";
import open from "open";
import path from "path";
const _dirname = path.resolve();

function init() {
  let app = express();
  app.use("/", express.static("app"));
  app.use('/bs/css', express.static(path.join(_dirname,
    'node_modules/bootstrap/dist/css')));
  app.use('/resources/css', express.static(path.join(_dirname,
    'node_modules/@fortawesome/fontawesome-free/css')));
  app.use('/resources/js', express.static(path.join(_dirname,
    'node_modules/bootstrap/dist/js')));
  app.use('/resources/js', express.static(path.join(_dirname,
    'node_modules/jquery/dist')));
  app.listen(process.env.DEV_PORT, function() {
    console.log(
      "Server started. Opening application in browser ... [Press CTRL + C to stop server]",
    );
    open(`http://localhost:${process.env.DEV_PORT}`);
  });
}

init();