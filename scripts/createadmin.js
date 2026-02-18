import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function createAdmin() {

  await mongoose.connect("mongodb+srv://yandrapuanirudh_db_user:MUDdoxBsVeNBHG26@cluster0.k05cda0.mongodb.net/?appName=Cluster0");
  

  const hashed = await bcrypt.hash("anirudh", 10);

  await User.create({
    username: "anirudh",
    password: hashed,
    role: "admin",
    balance: 100000
  });

  console.log("✅ Admin Created");

  process.exit();
}

createAdmin();
