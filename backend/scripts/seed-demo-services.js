require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../db");
const Service = require("../models/Service");

const services = [
  {
    name: "Instagram Content Management",
    shortDescription: "Build a stronger Instagram presence with engaging content designed to attract the right audience and grow your brand.",
    detailedDescription: "We help businesses maintain a consistent, professional Instagram presence through strategic content planning, creative storytelling and audience-focused publishing.",
    features: [
      "Reels and carousel content planning",
      "Instagram Stories and content calendars",
      "Brand-focused creative direction",
      "Hashtag and audience research",
      "Content performance monitoring"
    ],
    order: 1,
    isPublished: true
  },
  {
    name: "Facebook Content Management",
    shortDescription: "Reach the right people, strengthen your brand presence and support business growth with strategic Facebook content and campaigns.",
    detailedDescription: "We create and manage Facebook content and campaign strategies that help businesses connect with relevant audiences, promote their offers and generate meaningful enquiries.",
    features: [
      "Facebook page content planning",
      "Paid campaign strategy and setup",
      "Local audience targeting",
      "Ad creative planning",
      "Retargeting strategy and performance tracking"
    ],
    order: 2,
    isPublished: true
  },
  {
    name: "SEO (Search Engine Optimization)",
    shortDescription: "Improve your search visibility and help potential customers discover your business through search engines.",
    detailedDescription: "Our SEO approach focuses on making your website easier to discover, understand and navigate, with strategies tailored to your business and target audience.",
    features: [
      "Keyword and competitor research",
      "On-page SEO optimization",
      "Local SEO and Google Business Profile guidance",
      "Technical SEO improvements",
      "Location-specific content strategy",
      "Search performance monitoring"
    ],
    order: 3,
    isPublished: true
  },
  {
    name: "Software Development",
    shortDescription: "Turn your ideas into reliable digital products, from professional business websites to custom web applications.",
    detailedDescription: "We develop digital solutions around your business needs, combining thoughtful user experiences with maintainable technology and practical functionality.",
    features: [
      "Business websites and landing pages",
      "Custom web applications",
      "Admin panels and content management systems",
      "API integrations and database solutions",
      "Workflow automation",
      "Responsive, mobile-friendly interfaces"
    ],
    order: 4,
    isPublished: true
  }
];

async function main() {
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const service of services) {
    const existing = await Service.findOne({ name: service.name });

    if (existing) {
      Object.assign(existing, service);
      await existing.save();
      updated++;
      console.log(`Updated: ${service.name}`);
    } else {
      await Service.create(service);
      created++;
      console.log(`Added: ${service.name}`);
    }
  }

  console.log("\n===== SERVICE SEED SUMMARY =====");
  console.log("New services:", created);
  console.log("Updated services:", updated);
  console.log("Total services:", await Service.countDocuments());
  console.log("Published services:", await Service.countDocuments({ isPublished: true }));
}

main()
  .catch((error) => {
    console.error("Service seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
