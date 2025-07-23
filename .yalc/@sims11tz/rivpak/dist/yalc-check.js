"use strict";
const fs = require("fs");
const path = require("path");
const yalcPath = path.resolve(".yalc/@sims11tz/rivpak");
const nodeModulesPath = path.resolve("node_modules/@sims11tz/rivpak");
function checkSymlink() {
    const isSymlink = fs.lstatSync(nodeModulesPath).isSymbolicLink();
    const target = fs.readlinkSync(nodeModulesPath);
    console.log("✅ node_modules/@sims11tz/rivpak is a symlink:");
    console.log("   →", target);
}
function checkYalcVersion() {
    const pkgJsonPath = path.join(yalcPath, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        console.log(`📦 YALC PACKAGE: ${pkg.name} v${pkg.version}`);
    }
    else {
        console.warn("❌ Could not find package.json in .yalc folder");
    }
}
function runCheck() {
    try {
        checkSymlink();
        checkYalcVersion();
    }
    catch (err) {
        console.error("❌ Error during yalc-check:", err.message);
    }
}
runCheck();
