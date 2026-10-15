const mongoose = require("mongoose");

const socialSchema = new mongoose.Schema(
  { platform: { type: String, trim: true, maxlength: 30 }, url: { type: String, trim: true, maxlength: 500 }, isVisible: { type: Boolean, default: true } },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    aboutText: { type: String, maxlength: 3000, default: "Reach Forever is a full-service digital marketing agency dedicated to helping businesses build meaningful digital experiences that drive measurable growth." },
    mission: { type: String, maxlength: 1500, default: "To turn passion into reach, reach into real customers, and hard work into a brand that grows forever." },
    vision: { type: String, maxlength: 1500, default: "To become the most trusted name in real business growth — built on genuine results, never fake numbers." },
    email: { type: String, trim: true, maxlength: 200, default: "" },
    phone: { type: String, trim: true, maxlength: 50, default: "" },
    whatsappUrl: { type: String, trim: true, maxlength: 500, default: "" },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    businessHours: { type: String, trim: true, maxlength: 300, default: "" },
    footerDescription: { type: String, maxlength: 500, default: "Good brands deserve to go further. We're here to help them get there." },
    socialLinks: { type: [socialSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SiteSettings || mongoose.model("SiteSettings", siteSettingsSchema);