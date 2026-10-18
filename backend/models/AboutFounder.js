const mongoose = require("mongoose");

const aboutFounderSchema = new mongoose.Schema(
  {
    isVisible: { type: Boolean, default: true },
    eyebrow: { type: String, default: "THE PERSON BEHIND THE WORK", maxlength: 100 },
    heading: { type: String, default: "Good work starts with good people.", maxlength: 180 },
    description: { type: String, default: "We help brands reach further and grow faster.", maxlength: 3000 },
    founderName: { type: String, default: "Ansh Khatri", maxlength: 120 },
    founderTitle: { type: String, default: "Founder & CEO, Reach Forever", maxlength: 160 },
    founderStory: { type: String, default: "Passion into reach. Growth that lasts.", maxlength: 3000 },
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
