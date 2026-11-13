// Entry point the desktop app starts with its bundled Node.js. Runs the
// Next.js standalone server and reports on stdout when it is ready:
//   __COMPOOSS_READY__          the app can open the window
//   __COMPOOSS_ERROR__ <code>   startup failed (e.g. EADDRINUSE)
"use strict";

const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const port = Number(process.env.PORT);
const host = process.env.HOSTNAME;

// Never run the server without the desktop lock (see desktop.util.ts).
if (!process.env.COMPOOSS_DESKTOP_TOKEN || !port || host !== "127.0.0.1") {
  console.log("__COMPOOSS_ERROR__ BAD_ENV");
  process.exit(1);
}

// The app holds our stdin open. It closes when the app quits or crashes, so
// the server never outlives it.
process.stdin.on("end", () => process.exit(0));
process.stdin.on("error", () => process.exit(0));
process.stdin.resume();

function reportWhenReady() {
  const retry = () => setTimeout(check, 100);
  const check = () => {
    http
      .get({ host, port, path: "/__desktop/health" }, (res) => {
        res.resume();
        if (res.statusCode === 200) console.log("__COMPOOSS_READY__");
        else retry();
      })
      .on("error", retry);
  };
  check();
}

// Next.js only logs a failed listen, so check the port first and report it.
// After an update the app restarts right away, and the previous server may
// still be exiting, so a busy port gets a few seconds to free up.
const PORT_WAIT_MS = 5000;
const startedAt = Date.now();

function start() {
  const probe = net.createServer();
  probe.once("error", (err) => {
    if (err.code === "EADDRINUSE" && Date.now() - startedAt < PORT_WAIT_MS) {
      setTimeout(start, 200);
      return;
    }
    console.log(`__COMPOOSS_ERROR__ ${err.code || err.message}`);
    process.exit(1);
  });
  probe.listen(port, host, () => {
    probe.close(() => {
      require(path.join(__dirname, "apps", "compooss", "server.js"));
      reportWhenReady();
    });
  });
}

start();
