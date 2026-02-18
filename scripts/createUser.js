import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

mongoose.connect("mongodb+srv://yandrapuanirudh_db_user:MUDdoxBsVeNBHG26@cluster0.k05cda0.mongodb.net/?appName=Cluster0");

async function createUser() {
  const hashed = await bcrypt.hash("anirudh123", 10);

  await User.create({
    username: "anirudh",
    password: hashed,
    role: "user",
    balance: 1000
  });

  console.log("Dummy user created");
  process.exit();
}

createUser();
