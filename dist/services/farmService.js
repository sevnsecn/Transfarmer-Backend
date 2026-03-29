"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFarms = getAllFarms;
exports.getFarmById = getFarmById;
exports.createFarm = createFarm;
exports.updateFarm = updateFarm;
exports.deleteFarm = deleteFarm;
const db_1 = require("../lib/db");
const Farm_1 = __importDefault(require("../models/Farm"));
async function getAllFarms() {
    await (0, db_1.connectDB)();
    return Farm_1.default.find().lean();
}
async function getFarmById(id) {
    await (0, db_1.connectDB)();
    return Farm_1.default.findById(id).lean();
}
async function createFarm(data) {
    await (0, db_1.connectDB)();
    return Farm_1.default.create(data);
}
async function updateFarm(id, data) {
    await (0, db_1.connectDB)();
    const farm = await Farm_1.default.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!farm)
        throw new Error("Farm not found");
    return farm;
}
async function deleteFarm(id) {
    await (0, db_1.connectDB)();
    const farm = await Farm_1.default.findByIdAndDelete(id);
    if (!farm)
        throw new Error("Farm not found");
    return farm;
}
