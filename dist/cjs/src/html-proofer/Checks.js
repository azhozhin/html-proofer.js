"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllChecks = void 0;
const Links_1 = require("./check/Links");
const Images_1 = require("./check/Images");
const Scripts_1 = require("./check/Scripts");
const Favicon_1 = require("./check/Favicon");
exports.AllChecks = {
    Links: Links_1.Links,
    Images: Images_1.Images,
    Scripts: Scripts_1.Scripts,
    Favicon: Favicon_1.Favicon,
};
