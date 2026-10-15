require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../db");
const Result = require("../models/Result");

const DEMO_PREFIX = "reachforever-demo-";

const demos = [
  ["Brand Identity", "instagram", "photo-1558655146-d09347e92766"],
  ["Social Media Growth", "facebook", "photo-1611162617474-5b21e879e113"],
  ["Creative Campaign", "instagram", "photo-1552664730-d307ca884978"],
  ["Digital Strategy", "facebook", "photo-1460925895917-afdab827c52f"],
  ["Performance Marketing", "instagram", "photo-1460925895917-afdab827c52f"],
  ["Content Creation", "facebook", "photo-1542744173-8e7e53415bb0"],
  ["Website Launch", "instagram", "photo-1467232004584-a241de8bcf5d"],
  ["Brand Awareness", "facebook", "photo-1556761175-b413da4baf72"],
  ["Campaign Analytics", "instagram", "photo-1551288049-bebda4e38f71"],
  ["Creative Direction", "facebook", "photo-1553877522-43269d4ea984"],
  ["Ecommerce Growth", "instagram", "photo-1556742049-0cfed4f6a45d"],
  ["Community Building", "facebook", "photo-1521737711867-e3b97375f902"],
  ["Marketing Insights", "instagram", "photo-1432888622747-4eb9a8efeb07"],
  ["Lead Generation", "facebook", "photo-1552664730-d307ca884978"],
  ["Product Campaign", "instagram", "photo-1547658719-da2b51169166"],
  ["Audience Research", "facebook", "photo-1551836022-d5d88e9218df"],
  ["Visual Storytelling", "instagram", "photo-1497366754035-f200968a6e72"],
  ["Growth Dashboard", "facebook", "photo-1460925895917-afdab827c52f"],
  ["Digital Presence", "instagram", "photo-1516321318423-f06f85e504b3"],
  ["Campaign Results", "facebook", "photo-1551434678-e076c223a692"],
];

async function main() {
  await connectDB();

  let created = 0;
  let updated = 0;

  for (let index = 0; index < demos.length; index++) {
    const [title, platform, photoId] = demos[index];
    const demoId = `${DEMO_PREFIX}${String(index + 1).padStart(2, "0")}`;

    const values = {
      imageUrl: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`,
      // Deliberately not a real Cloudinary public ID.
      imagePublicId: demoId,
      platform,
      socialUrl:
        platform === "instagram"
          ? `https://www.instagram.com/`
          : `https://www.facebook.com/`,
      order: index + 1,
      isActive: true,
    };

    const existing = await Result.findOne({ imagePublicId: demoId });

    if (existing) {
      Object.assign(existing, values);
      await existing.save();
      updated++;
    } else {
      await Result.create(values);
      created++;
    }

    console.log(`${String(index + 1).padStart(2, "0")}. ${title} (${platform})`);
  }

  const demoCount = await Result.countDocuments({
    imagePublicId: { $regex: `^${DEMO_PREFIX}` },
  });
  const activeCount = await Result.countDocuments({
    imagePublicId: { $regex: `^${DEMO_PREFIX}` },
    isActive: true,
  });
  const totalCount = await Result.countDocuments();

  console.log("\n===== SEED SUMMARY =====");
  console.log("New demo records:", created);
  console.log("Updated demo records:", updated);
  console.log("Total demo records:", demoCount);
  console.log("Active demo records:", activeCount);
  console.log("Total results in database (including real records):", totalCount);
}

main()
  .catch((error) => {
    console.error("Demo seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
