// ----------------------------------------------------
// SHARAF DENT LAB - Appwrite & MockDB Bridge Client
// Optimized for Appwrite Free Tier (750K requests/month)
// ----------------------------------------------------

let appwriteClient = null;
let appwriteDatabases = null;
let appwriteStorage = null;
let appwriteAccount = null;

// ── Connection Cache ─────────────────────────────────
// checkCloud() is cached so it only hits Appwrite ONCE
// per page session instead of before every single call.
let _cloudStatusCache = null; // null = unchecked, true/false = result

// ── In-memory data cache (30 second TTL) ─────────────
// Prevents re-fetching the same collection on every tab
// switch. Cleared automatically on any write operation.
const _dataCache = {};
const CACHE_TTL_MS = 30_000; // 30 seconds

function _cacheGet(key) {
  const entry = _dataCache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    delete _dataCache[key];
    return null;
  }
  return entry.data;
}

function _cacheSet(key, data) {
  _dataCache[key] = { data, ts: Date.now() };
}

function _cacheClear(...keys) {
  if (keys.length === 0) {
    // Clear everything
    Object.keys(_dataCache).forEach(k => delete _dataCache[k]);
  } else {
    keys.forEach(k => delete _dataCache[k]);
  }
}

// Determine if we can connect to Appwrite Cloud
function initAppwrite() {
  if (typeof Appwrite === "undefined") {
    console.warn("⚠️ Appwrite Web SDK not loaded yet. Running offline MockDB fallback.");
    return false;
  }
  
  try {
    appwriteClient = new Appwrite.Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId);
      
    appwriteDatabases = new Appwrite.Databases(appwriteClient);
    appwriteStorage = new Appwrite.Storage(appwriteClient);
    appwriteAccount = new Appwrite.Account(appwriteClient);
    return true;
  } catch (error) {
    console.error("⚠️ Failed to initialize Appwrite Cloud:", error.message);
    return false;
  }
}

// ----------------------------------------------------
// LOCAL MOCK DATABASE SYSTEM (LocalStorage backup)
// ----------------------------------------------------
const MOCK_DATA_KEY = "sharafdent_mock_db";

const DEFAULT_MOCK_DATA = {
  siteSettings: {
    $id: "settings-doc",
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
  },
  sections: [
    {
      $id: "sec-hero",
      key: "hero",
      title: "Pioneering Digital Dental Artistry",
      subtitle: "SHARAF DENT LAB",
      description: "Empowering visionary dental clinics with state-of-the-art restorative craftsmanship. From micron-perfect CAD/CAM zirconia structures to specialized complex implant full arches, we blend clinical precision with premium custom aesthetics.",
      ctaText: "Upload Digital Case Scan",
      ctaLink: "#contact",
      isVisible: true
    },
    {
      $id: "sec-about",
      key: "about",
      title: "Crafting Precision Dental Standards",
      subtitle: "ABOUT OUR LABORATORY",
      description: "Sharaf Dent Lab operates at the ultimate frontier of clinical aesthetics. Strategically serving elite dental centers, our facility leverages the latest CAD/CAM milling tools, 3D printing equipment, and specialized technician experience. Every bridge, crown, and custom abutment undergoes triple microscopic tolerance validation to secure clinical excellence.",
      ctaText: "Discover Specialties",
      ctaLink: "#services",
      isVisible: true
    },
    {
      $id: "sec-mission",
      key: "mission",
      title: "Precision Integrity & Absolute Fit",
      subtitle: "OUR LABORATORY VIRTUES",
      description: "Our mission is simple: to make zero-adjustment dental restorations the baseline standard. We are dedicated to providing dentists with frictionless chairside results, outstanding aesthetic outcomes, and superior materials integrity.",
      ctaText: "Review Case Portfolio",
      ctaLink: "#gallery",
      isVisible: true
    },
    {
      $id: "sec-contact",
      key: "contact",
      title: "Partner with Sharaf Dent Lab",
      subtitle: "CASE TRANSMISSION STATION",
      description: "Experience direct workflow coordination. Securely upload clinical scan formats (STL, ZIP, PDF), select your prosthetic parameters, specify shade parameters, and monitor your case's digital timeline.",
      ctaText: "Transmit Case File",
      ctaLink: "#contact",
      isVisible: true
    }
  ],
  whyUs: [
    { $id: "why-1", title: "Micron-Level Tolerance", description: "Utilizing five-axis industrial German milling machinery to ensure standard dental fittings under 10 microns.", icon: "Shield", order: 1, isPublished: true },
    { $id: "why-2", title: "Elite Aesthetics Artists", description: "Our expert technicians are trained specifically in advanced multi-layered zirconia staining and ceramic layering techniques.", icon: "Sparkles", order: 2, isPublished: true },
    { $id: "why-3", title: "Speedy Case Dispatch", description: "Standard single crown items delivered in 48 hours, fully processed through standard digital scan files.", icon: "Activity", order: 3, isPublished: true },
    { $id: "why-4", title: "Advanced Biomaterials", description: "Exclusively using premium certified German blocks and hypoallergenic titanium structures.", icon: "Layers", order: 4, isPublished: true },
    { $id: "why-5", title: "Total Clinical Support", description: "Direct diagnostic support, custom shading coordinates, and chairside consultation.", icon: "HelpCircle", order: 5, isPublished: true }
  ],
  services: [
    {
      $id: "serv-1",
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
      $id: "serv-2",
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
      $id: "serv-3",
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
  ],
  cases: [
    {
      $id: "case-1",
      title: "Anterior Aesthetic Restoration Smile Makeover",
      slug: "smile-makeover-emax",
      category: "E.max",
      shortDescription: "Complete reconstruction of 8 anterior units using premium E.max glass-ceramic veneers.",
      fullDescription: "A clinical case displaying a smile transformation. The patient presented with dental wear, severe shade variations, and irregular spacing. We digitally designed 8 custom IPS e.max veneers (0.3mm prep). Precision crafted and custom glazed to mirror natural translucent enamel structures.",
      mainImageId: "",
      beforeImageId: "",
      afterImageId: "",
      galleryImageIds: [],
      order: 1,
      isFeatured: true,
      isPublished: true,
      seoTitle: "Smile Makeover E.max Anterior Veneers Case study",
      seoDescription: "Transformation of 8 anterior units with ultra-thin E.max custom-glazed veneers."
    },
    {
      $id: "case-2",
      title: "Full-Arch Hybrid Zirconia Reconstruction",
      slug: "full-arch-zirconia",
      category: "All-on-X",
      shortDescription: "Maxillary full-arch rehabilitation on 6 implants with titanium milled bar.",
      fullDescription: "A massive restorative case. The patient had complete maxillary tooth loss. Milled a custom bio-compatible grade 5 titanium bar framework to achieve absolute passive fit. Then layered custom monolithic zirconia overlays with realistic gingival staining.",
      mainImageId: "",
      beforeImageId: "",
      afterImageId: "",
      galleryImageIds: [],
      order: 2,
      isFeatured: true,
      isPublished: true,
      seoTitle: "Full-Arch Implant Hybrid Zirconia restoration",
      seoDescription: "Milled grade-5 titanium bar combined with multi-layer zirconia and pink aesthetic staining."
    }
  ],
  processSteps: [
    { $id: "proc-1", title: "Digital Impression", description: "Receive intraoral scans directly from your clinic portal (PDF, STL, ZIP).", icon: "Camera", order: 1, isPublished: true },
    { $id: "proc-2", title: "CAD CAD/CAM Design", description: "Exocad design mapping micro-tolerances and custom contacts specs.", icon: "Layers", order: 2, isPublished: true },
    { $id: "proc-3", title: "Precision Milling", description: "Milled in 5-axis German machinery and sintered inside computerized furnaces.", icon: "Activity", order: 3, isPublished: true },
    { $id: "proc-4", title: "Hand-Crafting", description: "Manual ceramic layering, customized staining, and micro-glazing.", icon: "Sparkles", order: 4, isPublished: true },
    { $id: "proc-5", title: "Sterile Sterile Dispatch", description: "Microscopic quality check, sterilization, and rapid courier delivery.", icon: "Shield", order: 5, isPublished: true }
  ],
  contactMessages: []
};

// Access MockDB with direct load/saves
class MockDB {
  static getDB() {
    let raw = localStorage.getItem(MOCK_DATA_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(DEFAULT_MOCK_DATA));
      return DEFAULT_MOCK_DATA;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_MOCK_DATA;
    }
  }

  static saveDB(data) {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(data));
  }

  static getCollection(key) {
    return this.getDB()[key] || [];
  }

  static saveCollection(key, list) {
    const db = this.getDB();
    db[key] = list;
    this.saveDB(db);
  }
}
// ----------------------------------------------------
// MASTER CLIENT INTERFACE — Optimized for Free Tier
// ✅ checkCloud() cached once per session (no duplicate health checks)
// ✅ GET operations cached 30s in-memory (no re-fetch on tab switch)
// ✅ Write operations clear relevant cache key only
// ----------------------------------------------------
const AppServices = {

  // ── Connection Check (cached for entire session) ──
  async checkCloud() {
    // Already know the answer for this session
    if (_cloudStatusCache !== null) return _cloudStatusCache;

    // Sandbox mode always uses MockDB
    if (localStorage.getItem("sharafdent_sandbox_mode") === "true") {
      _cloudStatusCache = false;
      return false;
    }

    if (!initAppwrite()) {
      _cloudStatusCache = false;
      return false;
    }

    try {
      // ONE small verification call — result is cached for the whole session
      await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.siteSettings,
        [Appwrite.Query.limit(1)]
      );
      _cloudStatusCache = true;
      return true;
    } catch (e) {
      console.warn("⚠️ Appwrite Cloud unreachable — using local MockDB.", e.message);
      _cloudStatusCache = false;
      return false;
    }
  },

  // Reset the cache (called on logout / explicit refresh)
  resetCache() {
    _cloudStatusCache = null;
    _cacheClear();
  },

  // ── 1. Site Settings ────────────────────────────────
  async getSettings() {
    const cached = _cacheGet("settings");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.siteSettings
      );
      result = res.documents[0] || DEFAULT_MOCK_DATA.siteSettings;
    } else {
      result = MockDB.getDB().siteSettings;
    }
    _cacheSet("settings", result);
    return result;
  },

  async updateSettings(id, data) {
    _cacheClear("settings");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.siteSettings,
        id, data
      );
    } else {
      const db = MockDB.getDB();
      db.siteSettings = { ...db.siteSettings, ...data };
      MockDB.saveDB(db);
      return db.siteSettings;
    }
  },

  // ── 2. Sections ─────────────────────────────────────
  async getSections() {
    const cached = _cacheGet("sections");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.sections
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("sections");
    }
    _cacheSet("sections", result);
    return result;
  },

  async updateSection(id, data) {
    _cacheClear("sections");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.sections,
        id, data
      );
    } else {
      const list = MockDB.getCollection("sections");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...data }; MockDB.saveCollection("sections", list); }
      return list[idx];
    }
  },

  // ── 3. Why Choose Us ────────────────────────────────
  async getWhyUs() {
    const cached = _cacheGet("whyUs");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.whyUs,
        [Appwrite.Query.orderAsc("order")]
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("whyUs").sort((a, b) => a.order - b.order);
    }
    _cacheSet("whyUs", result);
    return result;
  },

  async createWhyUs(data) {
    _cacheClear("whyUs");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.createDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.whyUs, Appwrite.ID.unique(), data);
    } else {
      const list = MockDB.getCollection("whyUs");
      const doc = { $id: "why-" + Date.now(), ...data };
      list.push(doc); MockDB.saveCollection("whyUs", list);
      return doc;
    }
  },

  async updateWhyUs(id, data) {
    _cacheClear("whyUs");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.whyUs, id, data);
    } else {
      const list = MockDB.getCollection("whyUs");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...data }; MockDB.saveCollection("whyUs", list); }
      return list[idx];
    }
  },

  async deleteWhyUs(id) {
    _cacheClear("whyUs");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.whyUs, id);
    } else {
      MockDB.saveCollection("whyUs", MockDB.getCollection("whyUs").filter(s => s.$id !== id));
      return true;
    }
  },

  // ── 4. Services ─────────────────────────────────────
  async getServices() {
    const cached = _cacheGet("services");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.services,
        [Appwrite.Query.orderAsc("order")]
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("services").sort((a, b) => a.order - b.order);
    }
    _cacheSet("services", result);
    return result;
  },

  async createService(data) {
    _cacheClear("services");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.createDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.services, Appwrite.ID.unique(), data);
    } else {
      const list = MockDB.getCollection("services");
      const doc = { $id: "serv-" + Date.now(), ...data };
      list.push(doc); MockDB.saveCollection("services", list);
      return doc;
    }
  },

  async updateService(id, data) {
    _cacheClear("services");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.services, id, data);
    } else {
      const list = MockDB.getCollection("services");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...data }; MockDB.saveCollection("services", list); }
      return list[idx];
    }
  },

  async deleteService(id) {
    _cacheClear("services");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.services, id);
    } else {
      MockDB.saveCollection("services", MockDB.getCollection("services").filter(s => s.$id !== id));
      return true;
    }
  },

  // ── 5. Portfolio Cases ──────────────────────────────
  async getCases() {
    const cached = _cacheGet("cases");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.cases,
        [Appwrite.Query.orderAsc("order")]
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("cases").sort((a, b) => a.order - b.order);
    }
    _cacheSet("cases", result);
    return result;
  },

  async createCase(data) {
    _cacheClear("cases");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.createDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cases, Appwrite.ID.unique(), data);
    } else {
      const list = MockDB.getCollection("cases");
      const doc = { $id: "case-" + Date.now(), ...data };
      list.push(doc); MockDB.saveCollection("cases", list);
      return doc;
    }
  },

  async updateCase(id, data) {
    _cacheClear("cases");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cases, id, data);
    } else {
      const list = MockDB.getCollection("cases");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...data }; MockDB.saveCollection("cases", list); }
      return list[idx];
    }
  },

  async deleteCase(id) {
    _cacheClear("cases");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.cases, id);
    } else {
      MockDB.saveCollection("cases", MockDB.getCollection("cases").filter(s => s.$id !== id));
      return true;
    }
  },

  // ── 6. Process Steps ────────────────────────────────
  async getProcessSteps() {
    const cached = _cacheGet("processSteps");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.processSteps,
        [Appwrite.Query.orderAsc("order")]
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("processSteps").sort((a, b) => a.order - b.order);
    }
    _cacheSet("processSteps", result);
    return result;
  },

  async createProcessStep(data) {
    _cacheClear("processSteps");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.createDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.processSteps, Appwrite.ID.unique(), data);
    } else {
      const list = MockDB.getCollection("processSteps");
      const doc = { $id: "proc-" + Date.now(), ...data };
      list.push(doc); MockDB.saveCollection("processSteps", list);
      return doc;
    }
  },

  async updateProcessStep(id, data) {
    _cacheClear("processSteps");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.processSteps, id, data);
    } else {
      const list = MockDB.getCollection("processSteps");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx] = { ...list[idx], ...data }; MockDB.saveCollection("processSteps", list); }
      return list[idx];
    }
  },

  async deleteProcessStep(id) {
    _cacheClear("processSteps");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.processSteps, id);
    } else {
      MockDB.saveCollection("processSteps", MockDB.getCollection("processSteps").filter(s => s.$id !== id));
      return true;
    }
  },

  // ── 7. Contact Messages ─────────────────────────────
  async getMessages() {
    const cached = _cacheGet("messages");
    if (cached) return cached;

    const isCloud = await this.checkCloud();
    let result;
    if (isCloud) {
      const res = await appwriteDatabases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.contactMessages
      );
      result = res.documents;
    } else {
      result = MockDB.getCollection("contactMessages");
    }
    _cacheSet("messages", result);
    return result;
  },

  async createMessage(data) {
    _cacheClear("messages");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.contactMessages,
        Appwrite.ID.unique(), data
      );
    } else {
      const list = MockDB.getCollection("contactMessages");
      const doc = { $id: "msg-" + Date.now(), $createdAt: new Date().toISOString(), status: "Unread", ...data };
      list.unshift(doc);
      MockDB.saveCollection("contactMessages", list);
      return doc;
    }
  },

  async updateMessageStatus(id, status) {
    _cacheClear("messages");
    const isCloud = await this.checkCloud();
    if (isCloud) {
      return await appwriteDatabases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.contactMessages,
        id, { status }
      );
    } else {
      const list = MockDB.getCollection("contactMessages");
      const idx = list.findIndex(s => s.$id === id);
      if (idx !== -1) { list[idx].status = status; MockDB.saveCollection("contactMessages", list); }
      return list[idx];
    }
  },

  // ── 8. Storage ──────────────────────────────────────
  async uploadFile(file) {
    // No caching for uploads — always hits storage
    const isCloud = await this.checkCloud();
    if (isCloud) {
      const res = await appwriteStorage.createFile(
        APPWRITE_CONFIG.bucketId, Appwrite.ID.unique(), file
      );
      return res.$id;
    } else {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  },

  // ── File URL builders ──────────────────────────────
  // Uses Appwrite Image Transformation to serve compressed
  // thumbnails — reduces bandwidth by up to 95% vs originals.
  //
  // getFileView(id)            → original (for admin previews)
  // getFileView(id, 800, 80)   → 800px wide, 80% quality
  // getFileThumb(id)           → 600px wide, 75% quality (public site default)

  getFileView(fileId, width = 0, quality = 0) {
    if (!fileId) return "";
    // Pass-through: already a full URL, data URI, or local path
    if (fileId.startsWith("http://") || fileId.startsWith("https://") ||
        fileId.startsWith("data:") || fileId.startsWith("pic/")) return fileId;
    if (fileId.startsWith("mock-file")) {
      return "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=400";
    }
    // Build URL directly — works even when appwriteStorage is null (cached page load)
    const base = APPWRITE_CONFIG.endpoint.replace(/\/$/, "");
    let url = `${base}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
    // Appwrite image transformation params (saves massive bandwidth)
    if (width > 0)   url += `&width=${width}`;
    if (quality > 0) url += `&quality=${quality}`;
    return url;
  },

  // Compressed thumbnail for public website cards & gallery
  // ~30-60 KB instead of ~1-3 MB — saves ~95% bandwidth
  getFileThumb(fileId, width = 600, quality = 75) {
    return this.getFileView(fileId, width, quality);
  },

  getFileDownload(fileId) {
    if (!fileId) return "#";
    if (fileId.startsWith("mock-file")) return "#mock-download";
    const base = APPWRITE_CONFIG.endpoint.replace(/\/$/, "");
    return `${base}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${fileId}/download?project=${APPWRITE_CONFIG.projectId}`;
  },



  // ── 9. Auth ─────────────────────────────────────────
  async login(email, password) {
    // Reset cache on new login
    this.resetCache();
    const isCloud = await this.checkCloud();
    if (isCloud) {
      try {
        await appwriteAccount.createEmailPasswordSession(email, password);
        return true;
      } catch (e1) {
        try {
          await appwriteAccount.createEmailSession(email, password);
          return true;
        } catch (e2) {
          throw new Error(e2.message || "Invalid administrative email or password.");
        }
      }
    } else {
      if (email === "admin@sharafdent.com" && password === "admin123") {
        localStorage.setItem("sharafdent_session", "true");
        return true;
      }
      throw new Error("Invalid administrative email or password.");
    }
  },

  async logout() {
    this.resetCache();
    if (_cloudStatusCache === true) {
      try { await appwriteAccount.deleteSession("current"); } catch (e) {}
    }
    localStorage.removeItem("sharafdent_session");
    localStorage.removeItem("sharafdent_sandbox_mode");
    return true;
  },

  async isLoggedIn() {
    if (localStorage.getItem("sharafdent_sandbox_mode") === "true") {
      return localStorage.getItem("sharafdent_session") === "true";
    }
    const isCloud = await this.checkCloud();
    if (isCloud) {
      try { await appwriteAccount.get(); return true; }
      catch (e) { return false; }
    } else {
      return localStorage.getItem("sharafdent_session") === "true";
    }
  }
};
