const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50, default: "" },
    company: { type: String, trim: true, maxlength: 160, default: "" },
    service: { type: String, trim: true, maxlength: 160, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["New", "In Progress", "Resolved"], default: "New" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);