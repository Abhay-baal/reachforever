const mongoose = require("mongoose");

const socialLinkSchema = new mongoose.Schema(
  { platform: { type: String, trim: true, maxlength: 30 }, url: { type: String, trim: true, maxlength: 500 } },
  { _id: false }
);

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 160 },
    biography: { type: String, trim: true, maxlength: 3000, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" },
    socialLinks: { type: [socialLinkSchema], default: [] },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);