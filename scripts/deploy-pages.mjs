#!/usr/bin/env node
/**
 * Publishes the built site (dist/) to the gh-pages branch, which GitHub Pages serves.
 * Run `npm run deploy`: it builds first, then force-pushes dist/ as a single commit.
 * Uses your normal git credentials for the "origin" remote.
 */
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const distPath = decodeURIComponent(dist.pathname).replace(/^\/([A-Za-z]:)/, "$1");
if (!existsSync(new URL("index.html", dist))) {
  console.error("[deploy] dist/index.html is missing: run the build first");
  process.exit(1);
}

const git = (args, cwd) => execFileSync("git", args, { cwd, stdio: "inherit" });
const origin = execFileSync("git", ["remote", "get-url", "origin"]).toString().trim();
// The deploy commit is signed with the same identity as the project's own commits
const identity = (key) => execFileSync("git", ["config", key]).toString().trim();
const author = ["-c", `user.name=${identity("user.name")}`, "-c", `user.email=${identity("user.email")}`];

// GitHub Pages runs Jekyll unless told not to, and Jekyll drops files that start with "_"
writeFileSync(new URL(".nojekyll", dist), "");
rmSync(new URL(".git", dist), { recursive: true, force: true });
git(["init", "-q", "-b", "gh-pages"], distPath);
git(["add", "-A"], distPath);
git([...author, "commit", "-q", "-m", "Deploy site"], distPath);
git(["push", "-f", origin, "gh-pages"], distPath);
rmSync(new URL(".git", dist), { recursive: true, force: true });
console.log("[deploy] published to gh-pages");
