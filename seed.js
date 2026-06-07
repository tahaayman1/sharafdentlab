const { Client, Databases, Storage, Users, ID, Permission, Role } = require("node-appwrite");

const ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const PROJECT_ID = "6a1d95ab0022f6a8cb34";
const API_KEY = "standard_b73d088c92393e0922dc5fd1821325fe294dae4a15b1c7e6114677a82ec420cf3f02b0bfa0fdc81b081faa3b1da4ae88d690c7e1a2ebb474ecbd5b6069bab1b04410ab092d03bc5dc0fd2a460a015c3d2588acadd3709fa325b00771598e477032a0e4591f5b633d43057e043d53d63f2e817252f24452d3d080106e3b209ec2";

const DATABASE_ID = "main-db";
const BUCKET_ID = "website-media";

const COLLECTIONS = {
  siteSettings: "site_settings",
  sections: "sections",
  whyUs: "why_us",
  services: "services",
  cases: "cases",
  processSteps: "process_steps",
  contactMessages: "contact_messages"
};

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

// Utility sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to poll attribute creation
async function waitForAttributes(databaseId, collectionId, expectedKeys) {
  process.stdout.write(`⏳ Waiting for schemas in ${collectionId} to stabilize...`);
  let ready = false;
  while (!ready) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const readyKeys = collection.attributes
        .filter(attr => attr.status === "available")
        .map(attr => attr.key);
      
      const allReady = expectedKeys.every(k => readyKeys.includes(k));
      if (allReady) {
        ready = true;
        console.log(" ✅ Ready!");
      } else {
        process.stdout.write(".");
        await sleep(1500);
      }
    } catch (e) {
      process.stdout.write("?");
      await sleep(1500);
    }
  }
}

async function runSeeder() {
  console.log("🚀 Starting Sharaf Dent Lab Cloud Database Bootstrap...");

  // 1. For clean bootstrap, try deleting database if it exists first
  try {
    await databases.delete(DATABASE_ID);
    console.log("🗑️ Deleted existing database 'main-db' for a fresh schema build.");
    await sleep(2000);
  } catch (e) {
    // Ignore if not exists
  }

  let dbExists = false;
  try {
    await databases.create(DATABASE_ID, "Sharaf Dent Lab Database");
    console.log("🆕 Database 'main-db' created successfully.");
    dbExists = true;
  } catch (err) {
    console.error("❌ Failed to create Database:", err);
    return;
  }

  if (!dbExists) return;

  // Helper to safely create collection
  async function createCollectionSafe(collectionId, name, documentPermissions) {
    try {
      await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`✅ Collection '${collectionId}' already exists.`);
      return false; // Already existed
    } catch (error) {
      if (error.code === 404) {
        await databases.createCollection(
          DATABASE_ID,
          collectionId,
          name,
          documentPermissions
        );
        console.log(`🆕 Collection '${collectionId}' created.`);
        return true; // Newly created
      }
      throw error;
    }
  }

  // Define Collections & Attributes
  try {
    // ----------------------------------------------------
    // COLLECTION: SITE SETTINGS
    // ----------------------------------------------------
    const newlyCreatedSettings = await createCollectionSafe(
      COLLECTIONS.siteSettings,
      "Site Settings",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedSettings) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "siteName", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "logoImageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "faviconImageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "phone", 50, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "whatsapp", 50, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "email", 100, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "facebookUrl", 200, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "instagramUrl", 200, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "address", 500, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "seoTitle", 200, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "seoDescription", 1000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "metaImageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "footerText", 250, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "defaultTheme", 50, false, "dark");
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.siteSettings, "showThemeSwitcher", false, true);
      
      await waitForAttributes(DATABASE_ID, COLLECTIONS.siteSettings, [
        "siteName", "phone", "whatsapp", "email", "seoTitle", "seoDescription", "footerText", "defaultTheme", "showThemeSwitcher"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: SECTIONS
    // ----------------------------------------------------
    const newlyCreatedSections = await createCollectionSafe(
      COLLECTIONS.sections,
      "Homepage Sections",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedSections) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "key", 50, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "title", 200, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "subtitle", 300, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "description", 4000, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "ctaText", 100, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "ctaLink", 200, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.sections, "imageId", 150, false, "");
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.sections, "isVisible", false, true);
      
      await waitForAttributes(DATABASE_ID, COLLECTIONS.sections, [
        "key", "title", "isVisible"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: WHY CHOOSE US
    // ----------------------------------------------------
    const newlyCreatedWhy = await createCollectionSafe(
      COLLECTIONS.whyUs,
      "Why Choose Us Cards",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedWhy) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.whyUs, "title", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.whyUs, "description", 2000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.whyUs, "icon", 50, false, "Sparkles");
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.whyUs, "order", false, 0, 100, 0);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.whyUs, "isPublished", false, true);
      
      await waitForAttributes(DATABASE_ID, COLLECTIONS.whyUs, [
        "title", "description", "icon", "order", "isPublished"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: SERVICES
    // ----------------------------------------------------
    const newlyCreatedServices = await createCollectionSafe(
      COLLECTIONS.services,
      "Services Restorations",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedServices) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "title", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "slug", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "shortDescription", 1000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "fullDescription", 4000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "imageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "icon", 50, false, "Layers");
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.services, "order", false, 0, 1000, 0);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.services, "isFeatured", false, false);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.services, "isPublished", false, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "seoTitle", 200, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.services, "seoDescription", 500, false, "");

      await waitForAttributes(DATABASE_ID, COLLECTIONS.services, [
        "title", "slug", "shortDescription", "fullDescription", "order", "isFeatured", "isPublished"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: CASES
    // ----------------------------------------------------
    const newlyCreatedCases = await createCollectionSafe(
      COLLECTIONS.cases,
      "Portfolio Cases",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedCases) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "title", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "slug", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "category", 100, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "shortDescription", 1000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "fullDescription", 4000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "mainImageId", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "beforeImageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "afterImageId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "galleryImageIds", 150, false, null, true); // array
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.cases, "order", false, 0, 1000, 0);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.cases, "isFeatured", false, false);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.cases, "isPublished", false, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "seoTitle", 200, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.cases, "seoDescription", 500, false, "");

      await waitForAttributes(DATABASE_ID, COLLECTIONS.cases, [
        "title", "slug", "category", "shortDescription", "fullDescription", "mainImageId", "order", "isFeatured", "isPublished"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: PROCESS STEPS
    // ----------------------------------------------------
    const newlyCreatedProcess = await createCollectionSafe(
      COLLECTIONS.processSteps,
      "Workflow Process Timeline",
      [Permission.read(Role.any()), Permission.write(Role.users())]
    );
    if (newlyCreatedProcess) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.processSteps, "title", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.processSteps, "description", 2000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.processSteps, "icon", 50, false, "Activity");
      await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.processSteps, "order", false, 0, 100, 0);
      await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.processSteps, "isPublished", false, true);

      await waitForAttributes(DATABASE_ID, COLLECTIONS.processSteps, [
        "title", "description", "icon", "order", "isPublished"
      ]);
    }

    // ----------------------------------------------------
    // COLLECTION: CONTACT MESSAGES
    // ----------------------------------------------------
    const newlyCreatedMessages = await createCollectionSafe(
      COLLECTIONS.contactMessages,
      "Case Files Prescription Messages",
      [Permission.create(Role.any()), Permission.read(Role.users()), Permission.write(Role.users())]
    );
    if (newlyCreatedMessages) {
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "name", 150, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "phone", 50, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "email", 100, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "clinicName", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "serviceType", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "message", 4000, true);
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "uploadedFileId", 150, false, "");
      await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.contactMessages, "status", 50, false, "Unread");
      
      await waitForAttributes(DATABASE_ID, COLLECTIONS.contactMessages, [
        "name", "phone", "email", "message", "status"
      ]);
    }

    // 3. Create Storage Bucket for Media
    try {
      await storage.getBucket(BUCKET_ID);
      console.log(`✅ Media Bucket '${BUCKET_ID}' already exists.`);
    } catch (error) {
      if (error.code === 404) {
        await storage.createBucket(
          BUCKET_ID,
          "Website Media Resources"
        );
        console.log(`🆕 Media Bucket '${BUCKET_ID}' created successfully.`);
      } else {
        throw error;
      }
    }

    // 4. Seed Settings Record
    console.log("🌱 Injecting brand metrics settings seed...");
    try {
      const listSettings = await databases.listDocuments(DATABASE_ID, COLLECTIONS.siteSettings);
      if (listSettings.total === 0) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.siteSettings,
          ID.unique(),
          {
            siteName: "Sharaf Dent Lab",
            phone: "+201091009894",
            whatsapp: "+201091009894",
            email: "sharafdent@gmail.com",
            seoTitle: "Sharaf Dent Lab | Premium Fixed Prosthetic & Implant Restorations",
            seoDescription: "Pioneering dental restorations through advanced CAD/CAM zirconia frameworks, E.max overlays, precision titanium abutments, and technical digital diagnostics.",
            footerText: "© 2026 Sharaf Dent Lab. All rights reserved. Precision dental craftsmanship.",
            defaultTheme: "dark",
            showThemeSwitcher: true,
            logoImageId: "",
            faviconImageId: "",
            metaImageId: "",
            facebookUrl: "https://facebook.com/sharafdent",
            instagramUrl: "https://instagram.com/sharafdent",
            address: "Zamalek Medical Complex, Floor 4, Cairo, Egypt"
          }
        );
        console.log("🌱 Brand Site Settings injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing Settings Seed:", e.message);
    }

    // 5. Seed Homepage Sections
    console.log("🌱 Injecting core layout section coordinates...");
    try {
      const listSecs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.sections);
      if (listSecs.total === 0) {
        const sectionsData = [
          {
            key: "hero",
            title: "Pioneering Digital Dental Artistry",
            subtitle: "SHARAF DENT LAB",
            description: "Empowering visionary dental clinics with state-of-the-art restorative craftsmanship. From micron-perfect CAD/CAM zirconia structures to specialized complex implant full arches, we blend clinical precision with premium custom aesthetics.",
            ctaText: "Upload Digital Case Scan",
            ctaLink: "#contact",
            isVisible: true
          },
          {
            key: "about",
            title: "Crafting Precision Dental Standards",
            subtitle: "ABOUT OUR LABORATORY",
            description: "Sharaf Dent Lab operates at the ultimate frontier of clinical aesthetics. Strategically serving elite dental centers, our facility leverages the latest CAD/CAM milling tools, 3D printing equipment, and specialized technician experience. Every bridge, crown, and custom abutment undergoes triple microscopic tolerance validation to secure clinical excellence.",
            ctaText: "Discover Specialties",
            ctaLink: "#services",
            isVisible: true
          },
          {
            key: "mission",
            title: "Precision Integrity & Absolute Fit",
            subtitle: "OUR LABORATORY VIRTUES",
            description: "Our mission is simple: to make zero-adjustment dental restorations the baseline standard. We are dedicated to providing dentists with frictionless chairside results, outstanding aesthetic outcomes, and superior materials integrity.",
            ctaText: "Review Case Portfolio",
            ctaLink: "#gallery",
            isVisible: true
          },
          {
            key: "contact",
            title: "Partner with Sharaf Dent Lab",
            subtitle: "CASE TRANSMISSION STATION",
            description: "Experience direct workflow coordination. Securely upload clinical scan formats (STL, ZIP, PDF), select your prosthetic parameters, specify shade parameters, and monitor your case's digital timeline.",
            ctaText: "Transmit Case File",
            ctaLink: "#contact",
            isVisible: true
          }
        ];
        
        for (const sec of sectionsData) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.sections, ID.unique(), sec);
        }
        console.log("🌱 Core layouts sections injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing Sections Seed:", e.message);
    }

    // 6. Seed Why Choose Us Cards
    console.log("🌱 Injecting 5 value pillars...");
    try {
      const listWhy = await databases.listDocuments(DATABASE_ID, COLLECTIONS.whyUs);
      if (listWhy.total === 0) {
        const whyData = [
          { title: "Micron-Level Tolerance", description: "Utilizing five-axis industrial German milling machinery to ensure standard dental fittings under 10 microns.", icon: "Shield", order: 1, isPublished: true },
          { title: "Elite Aesthetics Artists", description: "Our expert technicians are trained specifically in advanced multi-layered zirconia staining and ceramic layering techniques.", icon: "Sparkles", order: 2, isPublished: true },
          { title: "Speedy Case Dispatch", description: "Standard single crown items delivered in 48 hours, fully processed through standard digital scan files.", icon: "Activity", order: 3, isPublished: true },
          { title: "Advanced Biomaterials", description: "Exclusively using premium certified German blocks and hypoallergenic titanium structures.", icon: "Layers", order: 4, isPublished: true },
          { title: "Total Clinical Support", description: "Direct diagnostic support, custom shading coordinates, and chairside consultation.", icon: "HelpCircle", order: 5, isPublished: true }
        ];
        for (const w of whyData) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.whyUs, ID.unique(), w);
        }
        console.log("🌱 Value pillars injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing WhyUs Seed:", e.message);
    }

    // 7. Seed Services (Restoration Specialties)
    console.log("🌱 Injecting restorative specialties catalog...");
    try {
      const listServ = await databases.listDocuments(DATABASE_ID, COLLECTIONS.services);
      if (listServ.total === 0) {
        const servicesData = [
          {
            title: "Fixed Zirconia Restorations",
            slug: "fixed-zirconia",
            shortDescription: "Ultra-precise monolithic and layered zirconia crowns and multi-unit bridges.",
            fullDescription: "Our zirconia restorations are milled on premium German five-axis machines using advanced multi-layered blocks. Designed digitally with CAD tolerances under 10 microns, they offer outstanding strength (1200+ MPa) and elegant light transmission.",
            icon: "Layers",
            order: 1,
            isFeatured: true,
            isPublished: true,
            seoTitle: "Ultra-Strong Fixed Zirconia Restorations | Sharaf Dent Lab",
            seoDescription: "German monolithic and layered zirconia frameworks milled with CAD/CAM tolerances."
          },
          {
            title: "All-on-X Full Arch Solutions",
            slug: "all-on-x",
            shortDescription: "Immediate-load, fully customizable implant prostheses on lightweight titanium or Pekkton bars.",
            fullDescription: "Engineered specifically for complete full-arch rehabilitations. Features custom-engineered internal titanium reinforcement structures paired with composite teeth or premium multi-layer hybrid zirconia overlays, providing outstanding chewing comfort and clinical stability.",
            icon: "Activity",
            order: 2,
            isFeatured: true,
            isPublished: true,
            seoTitle: "All-on-X Full Arch Implant Restorations | Sharaf Dent Lab",
            seoDescription: "Lightweight titanium-reinforced full arch frameworks tailored for dynamic chewing comfort."
          },
          {
            title: "E.max Aesthetic Overlays",
            slug: "emax-overlays",
            shortDescription: "Superior glass-ceramic veneers, inlays, and ultra-thin anterior restorations.",
            fullDescription: "Premium lithium disilicate (IPS e.max) restorations crafted for maximum life-like aesthetic outcomes. Hand-finished by our master ceramicists to duplicate natural dentin translucency, custom shade gradients, and micro-texture matching.",
            icon: "Sparkles",
            order: 3,
            isFeatured: false,
            isPublished: true,
            seoTitle: "Aesthetic Lithium Disilicate E.max Veneers | Sharaf Dent Lab",
            seoDescription: "Exquisite hand-finished veneers and inlays mimicking natural dentin translucency."
          }
        ];
        for (const s of servicesData) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.services, ID.unique(), s);
        }
        console.log("🌱 Restorative catalog injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing Services Seed:", e.message);
    }

    // 8. Seed Portfolio Cases
    console.log("🌱 Injecting portfolio aesthetic case examples...");
    try {
      const listCases = await databases.listDocuments(DATABASE_ID, COLLECTIONS.cases);
      if (listCases.total === 0) {
        const casesData = [
          {
            title: "Anterior Aesthetic Restoration Smile Makeover",
            slug: "smile-makeover-emax",
            category: "E.max",
            shortDescription: "Complete reconstruction of 8 anterior units using premium E.max glass-ceramic veneers.",
            fullDescription: "A clinical case displaying a smile transformation. The patient presented with dental wear, severe shade variations, and irregular spacing. We digitally designed 8 custom IPS e.max veneers (0.3mm prep). Precision crafted and custom glazed to mirror natural translucent enamel structures.",
            mainImageId: "placeholder-main",
            beforeImageId: "placeholder-before",
            afterImageId: "placeholder-after",
            galleryImageIds: [],
            order: 1,
            isFeatured: true,
            isPublished: true,
            seoTitle: "Smile Makeover E.max Anterior Veneers Case study",
            seoDescription: "Transformation of 8 anterior units with ultra-thin E.max custom-glazed veneers."
          },
          {
            title: "Full-Arch Hybrid Zirconia Reconstruction",
            slug: "full-arch-zirconia",
            category: "All-on-X",
            shortDescription: "Maxillary full-arch rehabilitation on 6 implants with titanium milled bar.",
            fullDescription: "A massive restorative case. The patient had complete maxillary tooth loss. Milled a custom bio-compatible grade 5 titanium bar framework to achieve absolute passive fit. Then layered custom monolithic zirconia overlays with realistic gingival staining.",
            mainImageId: "placeholder-main",
            beforeImageId: "placeholder-before",
            afterImageId: "placeholder-after",
            galleryImageIds: [],
            order: 2,
            isFeatured: true,
            isPublished: true,
            seoTitle: "Full-Arch Implant Hybrid Zirconia restoration",
            seoDescription: "Milled grade-5 titanium bar combined with multi-layer zirconia and pink aesthetic staining."
          }
        ];
        for (const c of casesData) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.cases, ID.unique(), c);
        }
        console.log("🌱 Portfolio cases injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing Cases Seed:", e.message);
    }

    // 9. Seed Process Steps
    console.log("🌱 Injecting workflow timeline...");
    try {
      const listSteps = await databases.listDocuments(DATABASE_ID, COLLECTIONS.processSteps);
      if (listSteps.total === 0) {
        const stepsData = [
          { title: "Digital Impression", description: "Receive intraoral scans directly from your clinic portal (PDF, STL, ZIP).", icon: "Camera", order: 1, isPublished: true },
          { title: "CAD CAD/CAM Design", description: "Exocad design mapping micro-tolerances and custom contacts specs.", icon: "Layers", order: 2, isPublished: true },
          { title: "Precision Milling", description: "Milled in 5-axis German machinery and sintered inside computerized furnaces.", icon: "Activity", order: 3, isPublished: true },
          { title: "Hand-Crafting", description: "Manual ceramic layering, customized staining, and micro-glazing.", icon: "Sparkles", order: 4, isPublished: true },
          { title: "Sterile Sterile Dispatch", description: "Microscopic quality check, sterilization, and rapid courier delivery.", icon: "Shield", order: 5, isPublished: true }
        ];
        for (const s of stepsData) {
          await databases.createDocument(DATABASE_ID, COLLECTIONS.processSteps, ID.unique(), s);
        }
        console.log("🌱 Workflow timelines injected.");
      }
    } catch (e) {
      console.warn("⚠️ Warning writing ProcessSteps Seed:", e.message);
    }

    // 10. Seed Admin Account
    console.log("🌱 Injecting Administrative Account credentials...");
    try {
      const list = await users.list();
      const existing = list.users.find(u => u.email === "admin@sharafdent.com");
      if (!existing) {
        await users.create(ID.unique(), "admin@sharafdent.com", undefined, "admin123", "Lab Admin");
        console.log("🌱 Admin user admin@sharafdent.com injected successfully.");
      } else {
        console.log("✅ Admin user already exists.");
      }
    } catch (e) {
      console.warn("⚠️ Warning creating Admin User:", e.message);
    }

    console.log("\n⭐️⭐️⭐️ SUCCESS: Sharaf Dent Lab Cloud Database fully configured! ⭐️⭐️⭐️\n");
  } catch (error) {
    console.error("❌ Fatal Seeder Error:", error);
  }
}

runSeeder();
