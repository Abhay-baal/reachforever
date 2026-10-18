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
    slug: { type: String, trim: true, unique: true, sparse: true, index: true },
    longDescription: { type: String, trim: true, maxlength: 12000, default: "" },
    servicesProvided: { type: [String], default: [] },
    keyResults: { type: [String], default: [] },
    gallery: [{
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      alt: { type: String, trim: true, maxlength: 240, default: "" },
      caption: { type: String, trim: true, maxlength: 500, default: "" }
    }],
    clientName: { type: String, trim: true, maxlength: 160, default: "" },
    category: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    growthUrl: { type: String, trim: true, maxlength: 500, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    videoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
    videoAssetUrl: { type: String, trim: true, maxlength: 2000, default: "" },
    videoPublicId: { type: String, trim: true, maxlength: 300, default: "" },
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
