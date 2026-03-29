"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.getUserById = getUserById;
exports.getUserWithPassword = getUserWithPassword;
exports.updateUser = updateUser;
const User_1 = __importDefault(require("../models/User"));
const db_1 = require("../lib/db");
async function createUser(data) {
    await (0, db_1.connectDB)();
    const existing = await User_1.default.findOne({ user_email: data.user_email });
    if (existing) {
        throw new Error("Email already exists");
    }
    const user = await User_1.default.create(data);
    return user;
}
async function findUserByEmail(email) {
    await (0, db_1.connectDB)();
    return User_1.default.findOne({ user_email: email });
}
async function getUserById(id) {
    await (0, db_1.connectDB)();
    return User_1.default.findById(id).select("-password_hash");
}
async function getUserWithPassword(id) {
    await (0, db_1.connectDB)();
    return User_1.default.findById(id);
}
async function updateUser(id, updates) {
    await (0, db_1.connectDB)();
    if (updates.user_email) {
        const existing = await User_1.default.findOne({
            user_email: updates.user_email,
            _id: { $ne: id }
        });
        if (existing) {
            throw new Error("Email already exists");
        }
    }
    const user = await User_1.default.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).select("-password_hash");
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}
