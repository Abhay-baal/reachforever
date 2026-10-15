const mongoose = require("mongoose");

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["instagram", "facebook", "youtube", "tiktok", "linkedin", "x", "threads", "pinterest"],
      required: true,
    },
    url: { type: String, required: true, trim: true },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    clientName: { type: String, trim: true, maxlength: 160, default: "" },
    category: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    growthUrl: { type: String, trim: true, maxlength: 500, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    videoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
    // Legacy fields remain for compatibility with existing results.
    platform: {
      type: String,
      enum: ["instagram", "facebook"],
      required: true,
      default: "instagram",
    },
    socialUrl: {
      type: String,
      required: true,
      default: "https://www.instagram.com/",
    },
    // Undefined on older documents so the API can detect legacy entries.
    socialLinks: { type: [socialLinkSchema], default: undefined },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Result || mongoose.model("Result", resultSchema);
