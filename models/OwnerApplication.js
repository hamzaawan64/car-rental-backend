import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true },
  cnicNumber: { type: String, required: true },
  address: { type: String, required: true },
  reason: { type: String, required: true }, // "Why do you want to list cars?"
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  adminNote: { type: String, default: "" } // rejection reason
}, { timestamps: true })

export default mongoose.model("OwnerApplication", applicationSchema)