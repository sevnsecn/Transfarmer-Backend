import User from "../models/User";
import { connectDB } from "../lib/db";

export async function createUser(data: {
  user_name: string;
  user_email: string;
  password_hash: string;
}) {
  await connectDB();

  const existing = await User.findOne({ user_email: data.user_email });
  if (existing) {
    throw new Error("Email already exists");
  }

  const user = await User.create(data);
  return user;
}

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ user_email: email });
}

export async function getUserById(id: string) {
  await connectDB();
  return User.findById(id).select("-password_hash");
}

export async function getUserWithPassword(id: string) {
  await connectDB();
  return User.findById(id);
}

export async function updateUser(
  id: string,
  updates: {
    user_name?: string;
    user_email?: string;
    password_hash?: string;
  }
) {
  await connectDB();

  if (updates.user_email) {
    const existing = await User.findOne({
      user_email: updates.user_email,
      _id: { $ne: id }
    });
    if (existing) {
      throw new Error("Email already exists");
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updates },
  { returnDocument: 'after' }
  ).select("-password_hash");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}