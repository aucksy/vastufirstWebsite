// A tiny Chrome DevTools Protocol client.
//
// Plain curl gets bot-blocked by Booking.com; a real headless Chrome does not.
// Node 24 ships a WebSocket, so this needs no npm packages at all.
//
// Two gotchas that cost an afternoon the first time:
//   * Chrome refuses a DevTools WebSocket whose Origin it does not know, so
//     --remote-allow-origins=* is mandatory.
//   * Port 0 makes Chrome pick its own port and only print it into
//     DevToolsActivePort, which is easy to miss. Pick the port ourselves.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ||
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch(port = 9333) {
  const profile = mkdtempSync(join(tmpdir(), "trip-chrome-"));
  const child = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=1400,2400",
    "--lang=en-GB",
    "--disable-background-timer-throttling",
    "--disable-features=Translate,BackForwardCache",
  ], { stdio: "ignore" });

  // Wait for the debugging endpoint to answer.
  let info = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) { info = await r.json(); break; }
    } catch {}
    await sleep(400);
  }
  if (!info) { child.kill(); throw new Error("Chrome never started"); }

  return {
    port,
    close() {
      try { child.kill(); } catch {}
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

// One tab. Every call is awaited by id, so replies never cross over.
export async function newTab(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  const t = await r.json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let seq = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) {
      const { res, rej } = waiting.get(m.id);
      waiting.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method) {
      listeners.forEach(fn => fn(m));
    }
  };

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    waiting.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (waiting.has(id)) { waiting.delete(id); rej(new Error(method + " timed out")); }
    }, 60000);
  });

  return {
    send,
    on: fn => listeners.push(fn),
    async eval(expr) {
      const r = await send("Runtime.evaluate", {
        expression: expr, returnByValue: true, awaitPromise: true,
      });
      // exceptionDetails.text is only ever the word "Uncaught", which tells you
      // nothing and cost half an hour once. The real message and the stack live
      // on the exception object beside it.
      if (r.exceptionDetails){
        const d = r.exceptionDetails;
        throw new Error([d.text, d.exception && (d.exception.description || d.exception.value)]
          .filter(Boolean).join(": "));
      }
      return r.result.value;
    },
    async goto(url, settleMs = 2600) {
      await send("Page.navigate", { url });
      // Booking renders the rate table client-side, so "load" is too early.
      for (let i = 0; i < 40; i++) {
        await sleep(400);
        const ready = await this.eval("document.readyState").catch(() => null);
        if (ready === "complete") break;
      }
      await sleep(settleMs);
    },
    close() { try { ws.close(); } catch {} return fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); },
  };
}
