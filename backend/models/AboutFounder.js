const mongoose = require("mongoose");

const aboutFounderSchema = new mongoose.Schema(
  {
    isVisible: { type: Boolean, default: true },
    eyebrow: { type: String, default: "THE PEOPLE BEHIND THE WORK", maxlength: 100 },
    heading: { type: String, default: "Good work starts with good people.", maxlength: 180 },
    description: { type: String, default: "Reach Forever is a full-service digital marketing agency dedicated to helping businesses build meaningful digital experiences that drive measurable growth.", maxlength: 3000 },
    founderName: { type: String, default: "Ansh Khatri", maxlength: 120 },
    founderTitle: { type: String, default: "Founder & CEO, Reach Forever", maxlength: 160 },
    founderStory: { type: String, default: "To turn passion into reach, reach into real customers, and hard work into a brand that grows forever.", maxlength: 3000 },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    buttonText: { type: String, default: "Let's grow together", maxlength: 80 },
    buttonUrl: { type: String, default: "#contact", maxlength: 500 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AboutFounder ||
  mongoose.model("AboutFounder", aboutFounderSchema);
