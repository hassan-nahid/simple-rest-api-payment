"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("./env");
if (!env_1.envVars.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}
exports.stripe = new stripe_1.default(env_1.envVars.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
    typescript: true
});
