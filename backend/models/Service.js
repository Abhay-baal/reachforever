const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 500 },
    detailedDescription: { type: String, trim: true, maxlength: 3000, default: "" },
    features: { type: [String], default: [] },
    imageUrl: { type: String, trim: true, default: "" },
    ctaText: { type: String, trim: true, maxlength: 80, default: "" },
    ctaUrl: { type: String, trim: true, maxlength: 500, default: "" },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Service || mongoose.model("Service", serviceSchema);