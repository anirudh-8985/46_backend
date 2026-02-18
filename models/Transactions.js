import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  type: {
    type: String,
    enum: ["DEPOSIT", "WITHDRAW"],
    required: true
  },

  amount: Number,

  status: {
    type: String,
    default: "SUCCESS"
  }

}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
