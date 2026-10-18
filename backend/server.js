require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const connectDB = require("./db");
const Result = require("./models/Result");
const AboutFounder = require("./models/AboutFounder");
const Service = require("./models/Service");
const TeamMember = require("./models/TeamMember");
const SiteSettings = require("./models/SiteSettings");
const Enquiry = require("./models/Enquiry");
const adminAuth = require("./middleware/adminAuth");
const { uploadImage, uploadVideo, deleteImage, deleteVideo, isConfigured } = require("./cloudinary");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowed = [
        "http://localhost:3000",
        "http://192.168.1.6:3000",
        ...(process.env.FRONTEND_URL || "").split(",").map((url) => url.trim()),
      ].filter(Boolean);

      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter(req, file, callback) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error("Use a JPG, PNG, WebP, or AVIF image."));
    }
    callback(null, true);
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error("Use an MP4, WebM, or MOV video."));
    }
    callback(null, true);
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many enquiries. Please try again later." },
});

function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = crypto.createHash("sha256").update(a).digest();
  const right = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

const SOCIAL_HOSTS = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.watch"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  linkedin: ["linkedin.com"],
  x: ["x.com", "twitter.com"],
  threads: ["threads.net"],
  pinterest: ["pinterest.com"],
};

function validSocialUrl(value, platform) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;

    const host = url.hostname.toLowerCase();
    const allowedHosts = platform
      ? SOCIAL_HOSTS[platform] || []
      : Object.values(SOCIAL_HOSTS).flat();

    return allowedHosts.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function parseSocialLinks(value) {
  let links = value;

  if (typeof links === "string") {
    try {
      links = JSON.parse(links);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(links)) return null;

  const cleaned = [];
  for (const link of links) {
    if (!link || typeof link !== "object") return null;

    const platform = String(link.platform || "");
    const url = String(link.url || "").trim();

    if (!SOCIAL_HOSTS[platform] || !validSocialUrl(url, platform)) {
      return null;
    }

    cleaned.push({
      platform,
      url,
      isVisible: link.isVisible !== false,
    });
  }

  return cleaned;
}


function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "item";
}

function parseTextList(value, maxItems = 30, maxLength = 300) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string" ? value.split(/\r?\n|;/) : [];
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

async function uniqueSlug(Model, value, exceptId = null) {
  const base = slugify(value);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const filter = { slug: candidate };
    if (exceptId) filter._id = { $ne: exceptId };

    const existing = await Model.findOne(filter).select("_id").lean();
    if (!existing) return candidate;

    candidate = `${base}-${suffix++}`;
  }
}

function legacySlugMatch(document, slug, field) {
  return slugify(document?.slug || document?.[field] || "") === slug;
}

function publicResult(result) {
  const legacyLinks = result.platform && result.socialUrl
    ? [{ platform: result.platform, url: result.socialUrl, isVisible: true }]
    : [];

  return {
    _id: result._id,
    slug: result.slug || slugify(result.clientName || result.category || String(result._id)),
    imageUrl: result.imageUrl,
    imagePublicId: result.imagePublicId,
    platform: result.platform,
    socialUrl: result.socialUrl,
    socialLinks: Array.isArray(result.socialLinks)
      ? result.socialLinks
      : legacyLinks,
    clientName: result.clientName,
    category: result.category,
    description: result.description,
    longDescription: result.longDescription || result.description || "",
    servicesProvided: Array.isArray(result.servicesProvided) ? result.servicesProvided : [],
    keyResults: Array.isArray(result.keyResults) ? result.keyResults : [],
    gallery: Array.isArray(result.gallery) ? result.gallery : [],
    growthUrl: result.growthUrl,
    mediaType: result.mediaType,
    videoUrl: result.videoUrl,
    videoAssetUrl: result.videoAssetUrl || "",
    videoPublicId: result.videoPublicId || "",
    order: result.order,
  };
}

function cleanText(value, maxLength, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const cleaned = value.trim();
  return cleaned.length <= maxLength && (!required || cleaned.length > 0) ? cleaned : null;
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function publicService(service) {
  return { _id: service._id, name: service.name, shortDescription: service.shortDescription, detailedDescription: service.detailedDescription, features: service.features, imageUrl: service.imageUrl, ctaText: service.ctaText, ctaUrl: service.ctaUrl, order: service.order };
}

function publicTeamMember(member) {
  return {
    _id: member._id,
    slug: member.slug || slugify(member.name || String(member._id)),
    name: member.name,
    role: member.role,
    biography: member.biography || "",
    imageUrl: member.imageUrl || "",
    socialLinks: Array.isArray(member.socialLinks) ? member.socialLinks : [],
    order: member.order || 0,
  };
}

function publicSettings(settings) {
  if (!settings) return null;
  return { aboutText: settings.aboutText, mission: settings.mission, vision: settings.vision, email: settings.email, phone: settings.phone, whatsappUrl: settings.whatsappUrl, address: settings.address, businessHours: settings.businessHours, footerDescription: settings.footerDescription, socialLinks: settings.socialLinks };
}

app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    service: "ReachForever API",
    databaseConfigured: Boolean(process.env.MONGODB_URI),
    cloudinaryConfigured: isConfigured(),
    adminConfigured: Boolean(
      process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      process.env.JWT_SECRET
    ),
  });
});

app.post("/api/admin/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.JWT_SECRET
  ) {
    return res.status(503).json({ message: "Admin environment variables are not configured." });
  }

  if (
    !sameSecret(username, process.env.ADMIN_USERNAME) ||
    !sameSecret(password, process.env.ADMIN_PASSWORD)
  ) {
    return res.status(401).json({ message: "Incorrect username or password." });
  }

  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h", issuer: "reachforever-api", audience: "reachforever-admin" }
  );

  res.json({ token, expiresIn: 28800 });
});

app.get("/api/results", async (req, res, next) => {
  try {
    await connectDB();
    const results = await Result.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.set("Cache-Control", "no-store");
    res.json(results.map(publicResult));
  } catch (error) {
    next(error);
  }
});

app.get("/api/results/:slug", async (req, res, next) => {
  try {
    await connectDB();

    const requestedSlug = slugify(req.params.slug);
    let result = await Result.findOne({
      slug: requestedSlug,
      isActive: true,
    }).lean();

    // Support older projects that predate stored slugs.
    if (!result) {
      const legacyResults = await Result.find({ isActive: true }).lean();
      result = legacyResults.find((item) =>
        legacySlugMatch(item, requestedSlug, "clientName") ||
        (!item.slug && slugify(item.category || "") === requestedSlug)
      ) || null;
    }

    if (!result) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.set("Cache-Control", "no-store");
    res.json(publicResult(result));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/results", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const results = await Result.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/results",
  adminAuth,
  upload.single("image"),
  async (req, res, next) => {
    let uploaded;

    try {
      await connectDB();

      if (!req.file) {
        return res.status(400).json({ message: "Choose a cover image." });
      }

      const socialLinks = parseSocialLinks(req.body.socialLinks ?? "[]");
      if (socialLinks === null) {
        return res.status(400).json({
          message: "Check each social platform and enter a valid matching account URL.",
        });
      }

      const firstLink = socialLinks[0];
      uploaded = await uploadImage(req.file.buffer);

      const result = await Result.create({
        imageUrl: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
        clientName: cleanText(req.body.clientName, 160),
        slug: await uniqueSlug(Result, req.body.slug || req.body.clientName || req.body.category),
        category: cleanText(req.body.category, 160),
        description: cleanText(req.body.description, 3000),
        longDescription: cleanText(req.body.longDescription, 12000),
        servicesProvided: parseTextList(req.body.servicesProvided),
        keyResults: parseTextList(req.body.keyResults),
        growthUrl: cleanText(req.body.growthUrl, 500),
        mediaType: req.body.mediaType === "video" ? "video" : "image",
        videoUrl: cleanText(req.body.videoUrl, 1000),
        platform: firstLink?.platform === "facebook" ? "facebook" : "instagram",
        socialUrl: firstLink?.url || "https://www.instagram.com/",
        socialLinks,
        order: Number.isFinite(Number(req.body.order)) ? Number(req.body.order) : 0,
        isActive: req.body.isActive !== "false",
      });

      res.status(201).json(result);
    } catch (error) {
      if (uploaded?.public_id) {
        try {
          await deleteImage(uploaded.public_id);
        } catch (cleanupError) {
          console.error("Cloudinary rollback cleanup failed:", cleanupError.message);
        }
      }
      next(error);
    }
  }
);

app.patch("/api/admin/results/:id", adminAuth, async (req, res, next) => {
  try {
    await connectDB();

    const updates = {};
    const {
      platform, socialUrl, socialLinks: submittedLinks, order, isActive,
      clientName, slug, category, description, longDescription,
      servicesProvided, keyResults, growthUrl, mediaType, videoUrl
    } = req.body || {};

    for (const [field, value, maxLength] of [
      ["clientName", clientName, 160],
      ["slug", slug, 120],
      ["category", category, 160],
      ["description", description, 3000],
      ["longDescription", longDescription, 12000],
      ["growthUrl", growthUrl, 500],
      ["videoUrl", videoUrl, 1000]
    ]) {
      if (value !== undefined) {
        const cleaned = cleanText(value, maxLength);
        if (cleaned === null) return res.status(400).json({ message: `${field} is too long.` });
        updates[field] = cleaned;
      }
    }

    if (slug !== undefined || clientName !== undefined) {
      const slugSource = slug !== undefined ? slug : clientName;
      const cleanedSlug = cleanText(slugSource, 120);
      if (cleanedSlug === null) {
        return res.status(400).json({ message: "Slug must be 120 characters or fewer." });
      }
      updates.slug = await uniqueSlug(Result, cleanedSlug, req.params.id);
    }

    for (const [field, value] of [
      ["servicesProvided", servicesProvided],
      ["keyResults", keyResults]
    ]) {
      if (value !== undefined) updates[field] = parseTextList(value);
    }

    if (mediaType !== undefined) {
      if (!["image", "video"].includes(mediaType)) return res.status(400).json({ message: "Invalid media type." });
      updates.mediaType = mediaType;
    }

    if (platform !== undefined) {
      if (!["instagram", "facebook"].includes(platform)) {
        return res.status(400).json({ message: "Invalid legacy platform." });
      }
      updates.platform = platform;
    }

    if (socialUrl !== undefined) {
      if (!validSocialUrl(socialUrl)) {
        return res.status(400).json({ message: "Enter a valid social account URL." });
      }
      updates.socialUrl = socialUrl;
    }

    if (submittedLinks !== undefined) {
      const socialLinks = parseSocialLinks(submittedLinks);
      if (socialLinks === null) {
        return res.status(400).json({
          message: "Check each social platform and enter a valid matching account URL.",
        });
      }

      updates.socialLinks = socialLinks;
      if (socialLinks.length > 0) {
        updates.platform = socialLinks[0].platform === "facebook"
          ? "facebook"
          : "instagram";
        updates.socialUrl = socialLinks[0].url;
      }
    }

    if (order !== undefined) {
      if (!Number.isFinite(Number(order))) {
        return res.status(400).json({ message: "Order must be a number." });
      }
      updates.order = Number(order);
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be true or false." });
      }
      updates.isActive = isActive;
    }

    const result = await Result.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!result) return res.status(404).json({ message: "Result not found." });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/results/:id/image",
  adminAuth,
  upload.single("image"),
  async (req, res, next) => {
    let uploaded;

    try {
      await connectDB();

      if (!req.file) {
        return res.status(400).json({ message: "Choose a cover image." });
      }

      const result = await Result.findById(req.params.id);
      if (!result) return res.status(404).json({ message: "Result not found." });

      uploaded = await uploadImage(req.file.buffer);

      const previousPublicId = result.imagePublicId;
      result.imageUrl = uploaded.secure_url;
      result.imagePublicId = uploaded.public_id;
      await result.save();

      if (previousPublicId) {
        try {
          await deleteImage(previousPublicId);
        } catch (error) {
          console.error("Old image cleanup failed:", error.message);
        }
      }

      res.json(result);
    } catch (error) {
      if (uploaded?.public_id) {
        try {
          await deleteImage(uploaded.public_id);
        } catch (cleanupError) {
          console.error("Cloudinary rollback cleanup failed:", cleanupError.message);
        }
      }
      next(error);
    }
  }
);

app.post(
  "/api/admin/results/:id/video",
  adminAuth,
  videoUpload.single("video"),
  async (req, res, next) => {
    let uploaded;

    try {
      await connectDB();

      if (!req.file) {
        return res.status(400).json({ message: "Choose an MP4, WebM, or MOV video." });
      }

      const result = await Result.findById(req.params.id);
      if (!result) return res.status(404).json({ message: "Project not found." });

      uploaded = await uploadVideo(req.file.buffer);
      const previousPublicId = result.videoPublicId;

      result.videoAssetUrl = uploaded.secure_url;
      result.videoPublicId = uploaded.public_id;
      result.mediaType = "video";
      await result.save();

      if (previousPublicId) {
        try {
          await deleteVideo(previousPublicId);
        } catch (cleanupError) {
          console.error("Old video cleanup failed:", cleanupError.message);
        }
      }

      res.json(publicResult(result));
    } catch (error) {
      if (uploaded?.public_id) {
        try {
          await deleteVideo(uploaded.public_id);
        } catch (cleanupError) {
          console.error("Video upload rollback failed:", cleanupError.message);
        }
      }
      next(error);
    }
  }
);

app.post(
  "/api/admin/results/:id/gallery",
  adminAuth,
  upload.array("gallery", 12),
  async (req, res, next) => {
    const uploadedItems = [];
    try {
      await connectDB();
      const result = await Result.findById(req.params.id);
      if (!result) return res.status(404).json({ message: "Project not found." });
      if (!req.files?.length) {
        return res.status(400).json({ message: "Choose at least one gallery image." });
      }

      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, "reachforever/results/gallery");
        uploadedItems.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          alt: "",
          caption: "",
        });
      }

      result.gallery = [...(result.gallery || []), ...uploadedItems];
      await result.save();
      res.status(201).json(publicResult(result));
    } catch (error) {
      for (const item of uploadedItems) {
        try { await deleteImage(item.publicId); }
        catch (cleanupError) {
          console.error("Gallery upload rollback failed:", cleanupError.message);
        }
      }
      next(error);
    }
  }
);

app.delete("/api/admin/results/:id/gallery/:publicId", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Project not found." });

    const publicId = req.params.publicId;
    const item = (result.gallery || []).find((entry) => entry.publicId === publicId);
    if (!item) return res.status(404).json({ message: "Gallery image not found." });

    await deleteImage(item.publicId);
    result.gallery = result.gallery.filter((entry) => entry.publicId !== publicId);
    await result.save();
    res.json(publicResult(result));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/results/:id", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const result = await Result.findById(req.params.id);

    if (!result) return res.status(404).json({ message: "Result not found." });

    await result.deleteOne();

    let imageCleanup = "complete";
    const publicIds = [
      result.imagePublicId,
      ...(Array.isArray(result.gallery) ? result.gallery.map((item) => item.publicId) : []),
    ].filter(Boolean);

    for (const publicId of publicIds) {
      try {
        await deleteImage(publicId);
      } catch (error) {
        imageCleanup = "failed";
        console.error("Result deleted from MongoDB, but Cloudinary image cleanup failed:", publicId, error.message);
      }
    }

    let videoCleanup = "complete";
    if (result.videoPublicId) {
      try {
        await deleteVideo(result.videoPublicId);
      } catch (error) {
        videoCleanup = "failed";
        console.error("Result deleted from MongoDB, but Cloudinary video cleanup failed:", result.videoPublicId, error.message);
      }
    }

    res.json({
      message: "Result permanently deleted from the database.",
      imageCleanup,
      videoCleanup,
    });
  } catch (error) {
    next(error);
  }
});


function publicFounder(founder) {
  if (!founder) return null;
  return {
    isVisible: founder.isVisible,
    eyebrow: founder.eyebrow,
    heading: founder.heading,
    description: founder.description,
    founderName: founder.founderName,
    founderTitle: founder.founderTitle,
    founderStory: founder.founderStory,
    imageUrl: founder.imageUrl,
    buttonText: founder.buttonText,
    buttonUrl: founder.buttonUrl,
  };
}

const founderFields = [
  "isVisible", "eyebrow", "heading", "description",
  "founderName", "founderTitle", "founderStory",
  "buttonText", "buttonUrl",
];

app.get("/api/about-founder", async (req, res, next) => {
  try {
    await connectDB();
    const founder = await AboutFounder.findOne().lean();
    res.set("Cache-Control", "no-store");
    res.json(publicFounder(founder));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/about-founder", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    let founder = await AboutFounder.findOne();
    if (!founder) founder = await AboutFounder.create({});
    res.set("Cache-Control", "no-store");
    res.json(founder);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/about-founder", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const body = req.body || {};
    const updates = {};

    for (const field of founderFields) {
      if (body[field] === undefined) continue;

      if (field === "isVisible") {
        if (typeof body[field] !== "boolean") {
          return res.status(400).json({ message: "Visibility must be true or false." });
        }
        updates[field] = body[field];
        continue;
      }

      if (typeof body[field] !== "string") {
        return res.status(400).json({ message: `${field} must be text.` });
      }

      const value = body[field].trim();
      if (value.length > 3000) {
        return res.status(400).json({ message: `${field} is too long.` });
      }
      if (field === "buttonUrl" && value &&
          !value.startsWith("#") &&
          !/^https?:\/\//i.test(value)) {
        return res.status(400).json({ message: "Button link must be a section anchor or HTTP(S) URL." });
      }
      updates[field] = value;
    }

    let founder = await AboutFounder.findOne();
    if (!founder) founder = new AboutFounder();
    Object.assign(founder, updates);
    await founder.save();
    res.json(founder);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/admin/about-founder/image",
  adminAuth,
  upload.single("image"),
  async (req, res, next) => {
    let uploaded;

    try {
      await connectDB();
      if (!req.file) {
        return res.status(400).json({ message: "Choose a founder portrait." });
      }

      let founder = await AboutFounder.findOne();
      if (!founder) founder = new AboutFounder();

      uploaded = await uploadImage(req.file.buffer, "reachforever/founder");
      const previousPublicId = founder.imagePublicId;

      founder.imageUrl = uploaded.secure_url;
      founder.imagePublicId = uploaded.public_id;
      await founder.save();

      if (previousPublicId) {
        try {
          await deleteImage(previousPublicId);
        } catch (cleanupError) {
          console.error("Previous founder portrait cleanup failed:", cleanupError.message);
        }
      }

      res.json(founder);
    } catch (error) {
      if (uploaded?.public_id) {
        try {
          await deleteImage(uploaded.public_id);
        } catch (cleanupError) {
          console.error("Founder portrait rollback cleanup failed:", cleanupError.message);
        }
      }
      next(error);
    }
  }
);

app.get("/api/services", async (req, res, next) => {
  try {
    await connectDB();
    const services = await Service.find({ isPublished: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.json(services.map(publicService));
  } catch (error) { next(error); }
});

app.get("/api/team", async (req, res, next) => {
  try {
    await connectDB();
    const members = await TeamMember.find({ isPublished: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json(members.map(publicTeamMember));
  } catch (error) { next(error); }
});

app.get("/api/team/:slug", async (req, res, next) => {
  try {
    await connectDB();
    const requestedSlug = slugify(req.params.slug);
    const members = await TeamMember.find({ isPublished: true }).lean();
    const member = members.find((item) => legacySlugMatch(item, requestedSlug, "name"));
    if (!member) return res.status(404).json({ message: "Team member not found." });
    res.json(publicTeamMember(member));
  } catch (error) { next(error); }
});

app.get("/api/site-settings", async (req, res, next) => {
  try {
    await connectDB();
    res.json(publicSettings(await SiteSettings.findOne().lean()));
  } catch (error) { next(error); }
});

app.post("/api/enquiries", enquiryLimiter, async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = cleanText(body.name, 120, true);
    const message = cleanText(body.message, 5000, true);
    if (!name || !validEmail(body.email) || !message) {
      return res.status(400).json({ message: "Enter your name, a valid email, and a message." });
    }
    await connectDB();
    await Enquiry.create({ name, email: body.email.trim(), message, phone: cleanText(body.phone, 50), company: cleanText(body.company, 160), service: cleanText(body.service, 160) });
    res.status(201).json({ message: "Thanks. Your enquiry has been received." });
  } catch (error) { next(error); }
});

app.get("/api/admin/overview", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const [results, services, team, enquiries] = await Promise.all([
      Result.countDocuments({ isActive: true }),
      Service.countDocuments({ isPublished: true }),
      TeamMember.countDocuments({ isPublished: true }),
      Enquiry.countDocuments({ status: "New" }),
    ]);
    res.json({ publishedResults: results, publishedServices: services, teamMembers: team, newEnquiries: enquiries });
  } catch (error) { next(error); }
});

app.get("/api/admin/services", adminAuth, async (req, res, next) => {
  try { await connectDB(); res.json(await Service.find().sort({ order: 1, createdAt: -1 }).lean()); } catch (error) { next(error); }
});

app.post("/api/admin/services", adminAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = cleanText(body.name, 120, true);
    const shortDescription = cleanText(body.shortDescription, 500, true);
    if (!name || !shortDescription) return res.status(400).json({ message: "Service name and short description are required." });
    await connectDB();
    res.status(201).json(await Service.create({ ...body, name, shortDescription, order: Number(body.order) || 0 }));
  } catch (error) { next(error); }
});

app.patch("/api/admin/services/:id", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const updates = { ...req.body };
    if (updates.order !== undefined) updates.order = Number(updates.order);
    const service = await Service.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json(service);
  } catch (error) { next(error); }
});

app.delete("/api/admin/services/:id", adminAuth, async (req, res, next) => {
  try { await connectDB(); const result = await Service.findByIdAndDelete(req.params.id); if (!result) return res.status(404).json({ message: "Service not found." }); res.json({ message: "Service deleted." }); } catch (error) { next(error); }
});

app.get("/api/admin/team", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const members = await TeamMember.find().sort({ order: 1, createdAt: 1 });
    res.json(members);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/team", adminAuth, async (req, res, next) => {
  try {
    const name = cleanText(req.body?.name, 120, true);
    const role = cleanText(req.body?.role, 160, true);
    if (!name || !role) return res.status(400).json({ message: "Name and role are required." });
    await connectDB();
    const slug = await uniqueSlug(TeamMember, req.body?.slug || name);
    const member = await TeamMember.create({
      ...req.body,
      name,
      role,
      slug,
      order: Number(req.body.order) || 0,
    });
    res.status(201).json(member);
  } catch (error) { next(error); }
});

app.patch("/api/admin/team/:id", adminAuth, async (req, res, next) => {
  try {
    await connectDB();
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Team member not found." });

    const updates = { ...req.body };
    if (updates.name !== undefined) {
      updates.name = cleanText(updates.name, 120, true);
      if (!updates.name) return res.status(400).json({ message: "Name is required." });
    }
    if (updates.role !== undefined) {
      updates.role = cleanText(updates.role, 160, true);
      if (!updates.role) return res.status(400).json({ message: "Role is required." });
    }
    if (updates.slug !== undefined || updates.name !== undefined) {
      updates.slug = await uniqueSlug(TeamMember, updates.slug || updates.name || member.name, member._id);
    }
    if (updates.order !== undefined) updates.order = Number(updates.order);
    Object.assign(member, updates);
    await member.save();
    res.json(member);
  } catch (error) { next(error); }
});

app.post("/api/admin/team/:id/image", adminAuth, upload.single("image"), async (req, res, next) => {
  let uploaded;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Choose an image." });
    }

    await connectDB();

    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found." });
    }

    uploaded = await uploadImage(req.file.buffer, "reachforever/team");

    const previousPublicId = member.imagePublicId;
    member.imageUrl = uploaded.secure_url;
    member.imagePublicId = uploaded.public_id;
    await member.save();

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      try {
        await deleteImage(previousPublicId);
      } catch (cleanupError) {
        console.error("Previous team image cleanup failed:", cleanupError);
      }
    }

    res.json(member);
  } catch (error) {
    if (uploaded?.public_id) {
      try {
        await deleteImage(uploaded.public_id);
      } catch (cleanupError) {
        console.error("New team image cleanup failed:", cleanupError);
      }
    }

    next(error);
  }
});

app.delete("/api/admin/team/:id", adminAuth, async (req, res, next) => {
  try {
    await connectDB();

    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found." });
    }

    if (member.imagePublicId) {
      try {
        await deleteImage(member.imagePublicId);
      } catch (cleanupError) {
        console.error("Deleted team member image cleanup failed:", cleanupError);
      }
    }

    res.json({ message: "Team member deleted." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/site-settings", adminAuth, async (req, res, next) => {
  try { await connectDB(); let settings = await SiteSettings.findOne(); if (!settings) settings = await SiteSettings.create({}); res.json(settings); } catch (error) { next(error); }
});

app.patch("/api/admin/site-settings", adminAuth, async (req, res, next) => {
  try { await connectDB(); const settings = await SiteSettings.findOneAndUpdate({}, req.body || {}, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }); res.json(settings); } catch (error) { next(error); }
});

app.get("/api/admin/enquiries", adminAuth, async (req, res, next) => {
  try { await connectDB(); const filter = ["New", "In Progress", "Resolved"].includes(req.query.status) ? { status: req.query.status } : {}; res.json(await Enquiry.find(filter).sort({ createdAt: -1 }).lean()); } catch (error) { next(error); }
});

app.patch("/api/admin/enquiries/:id", adminAuth, async (req, res, next) => {
  try { if (!["New", "In Progress", "Resolved"].includes(req.body?.status)) return res.status(400).json({ message: "Invalid enquiry status." }); await connectDB(); const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }); if (!enquiry) return res.status(404).json({ message: "Enquiry not found." }); res.json(enquiry); } catch (error) { next(error); }
});

app.delete("/api/admin/enquiries/:id", adminAuth, async (req, res, next) => {
  try { await connectDB(); const enquiry = await Enquiry.findByIdAndDelete(req.params.id); if (!enquiry) return res.status(404).json({ message: "Enquiry not found." }); res.json({ message: "Enquiry deleted." }); } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : error.message;
    return res.status(400).json({ message });
  }

  if (error.message?.includes("image") || error.message?.includes("Cloudinary")) {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({ message: "Server error. Check the backend terminal logs." });
});

app.listen(PORT, () => {
  console.log(`ReachForever API listening on port ${PORT}`);
  if (!process.env.MONGODB_URI) console.warn("Set MONGODB_URI in backend/.env");
  if (!isConfigured()) console.warn("Set Cloudinary credentials in backend/.env");
});
