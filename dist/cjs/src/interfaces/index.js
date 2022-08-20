"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyOptions = exports.createCheck = void 0;
function createCheck(ctor, runner, html) {
    return new ctor(runner, html);
}
exports.createCheck = createCheck;
exports.EmptyOptions = {};
