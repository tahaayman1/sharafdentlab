// ----------------------------------------------------
// SHARAF DENT LAB - Public Frontend Dynamic Engine
// Optimized: localStorage cache (6h TTL) for public reads
// Zero extra Appwrite calls per visitor after first load
// ----------------------------------------------------

// ── Public-site localStorage cache ─────────────────────
// The public site ONLY reads data — never writes.
// We cache all Appwrite responses in localStorage for 6h.
// Admin writes always update Appwrite directly and bust
// the public cache so the next visitor gets fresh data.
const PUBLIC_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PUBLIC_CACHE_KEY = "sharafdent_pub_cache_v2";

const PubCache = {
  get(key) {
    return null; // Disabled localStorage cache to ensure instant updates on all devices
  },
  set(key, data) {
    // No-op
  },
  bust() {
    // No-op
  }
};

function getServiceTitleForCategory(cat, services = []) {
  if (!cat) return "";
  const cleanCat = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = services.find(s => {
    const cleanSlug = (s.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanTitle = (s.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleanSlug.includes(cleanCat) || cleanCat.includes(cleanSlug) ||
           cleanTitle.includes(cleanCat) || cleanCat.includes(cleanTitle);
  });
  if (match) return match.title;
  return null;
}

function formatCategoryName(cat) {
  if (!cat) return "";
  if (window._categoryMap && window._categoryMap[cat]) {
    return window._categoryMap[cat];
  }
  const mapping = {
    "zirconia": "Fixed Zirconia Restorations",
    "Zirconia": "Fixed Zirconia Restorations",
    "emax": "E.max Aesthetic Overlays",
    "E.max": "E.max Aesthetic Overlays",
    "emax-overlays": "E.max Aesthetic Overlays",
    "all-on-x": "All-on-X Full Arch Solutions",
    "All-on-X": "All-on-X Full Arch Solutions"
  };
  return mapping[cat] || cat;
}

// Cached wrappers for public reads (no-op writes still go directly to Appwrite)
async function pubGetSettings() {
  const c = PubCache.get("settings");
  if (c) return c;
  const d = await AppServices.getSettings();
  PubCache.set("settings", d);
  return d;
}
async function pubGetWhyUs() {
  const c = PubCache.get("whyUs");
  if (c) return c;
  const d = await AppServices.getWhyUs();
  PubCache.set("whyUs", d);
  return d;
}
async function pubGetServices() {
  const c = PubCache.get("services");
  if (c) return c;
  const d = await AppServices.getServices();
  PubCache.set("services", d);
  return d;
}
async function pubGetCases() {
  const c = PubCache.get("cases");
  if (c) return c;
  const d = await AppServices.getCases();
  PubCache.set("cases", d);
  return d;
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  initMobileMenu();
  loadLandingPage();
  initSheetsContactForm();
  initScrollSpy();
});

// ── Cross-tab live update ─────────────────────────────
// When admin saves changes, they call _bustPublicCache() which
// emits "sharafdent_sync_signal" to localStorage.
// The browser fires a "storage" event in ALL OTHER tabs on the same origin.
// This listener catches that event and reloads the page so visitors
// instantly see the new content without clearing cookies.
window.addEventListener("storage", (e) => {
  if (e.key === "sharafdent_sync_signal") {
    // Cache was busted by admin — reload silently
    window.location.reload();
  }
});

// ----------------------------------------------------
// 1. Theme Engine Switcher (Light / Dark)
// ----------------------------------------------------
function initThemeEngine() {
  const root = document.documentElement;
  let savedTheme = localStorage.getItem("sharafdent_theme") || "dark";
  if (savedTheme === "night") savedTheme = "dark"; // Migrate legacy theme
  
  // Apply saved theme
  root.setAttribute("data-theme", savedTheme);
  updateThemeSwitcherUI(savedTheme);
  
  // Attach switch listeners
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const themeVal = btn.getAttribute("data-theme-val");
      if (themeVal) {
        root.setAttribute("data-theme", themeVal);
        localStorage.setItem("sharafdent_theme", themeVal);
        updateThemeSwitcherUI(themeVal);
      }
    });
  });
}

function updateThemeSwitcherUI(activeTheme) {
  const themeBtns = document.querySelectorAll(".theme-btn");
  themeBtns.forEach(btn => {
    if (btn.getAttribute("data-theme-val") === activeTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// ----------------------------------------------------
// 2. Mobile Menu toggle drawer
// ----------------------------------------------------
function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle-btn");
  const navMenu = document.getElementById("nav-menu");
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }
}

// ----------------------------------------------------
// 3. Landing Page Loading & Population (index.html)
// ----------------------------------------------------

// Gallery slider state
let galleryIdx = 0;
let galleryTotal = 0;
let galleryAutoTimer = null;

async function loadLandingPage() {
  try {
    // ── Fetch ALL data in parallel (fastest possible load) ────
    const [settings, whyUs, services, cases] = await Promise.all([
      pubGetSettings(),
      pubGetWhyUs().catch(() => []),
      pubGetServices().catch(() => []),
      pubGetCases().catch(() => [])
    ]);

    applySiteSettings(settings);

    // ── Why Choose Grid ──────────────────────────────────────
    const whyGrid = document.getElementById("why-choose-grid");
    if (whyGrid) {
      const active = whyUs.filter(w => w.isPublished !== false);
      if (active.length > 0) {
        whyGrid.innerHTML = active.map(w => `
          <div class="why-card">
            <div class="why-icon"><i data-lucide="${w.icon || 'Sparkles'}"></i></div>
            <h3>${w.title}</h3>
            <p>${w.description}</p>
          </div>`).join("");
      }
    }

    // ── Services Grid & Dropdown Populating ───────────────────
    const servicesGrid = document.getElementById("services-grid");
    const formServiceSelect = document.getElementById("form-service");
    if (servicesGrid || formServiceSelect) {
      const activeServ = services
        .filter(s => s.isPublished !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (servicesGrid && activeServ.length > 0) {
        servicesGrid.innerHTML = activeServ.map(s => {
          const imgSrc = s.imageId ? AppServices.getFileThumb(s.imageId, 500, 75) : 'pic/zirconia.png';
          const features = (s.fullDescription || "").split('\n').map(l => l.trim()).filter(Boolean);
          return `
            <div class="svc-card">
              <div class="svc-card-icon"><img src="${imgSrc}" alt="${s.title}" loading="lazy"></div>
              <h3>${s.title}</h3>
              <ul class="svc-list">${features.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>`;
        }).join("");
      }

      if (formServiceSelect && activeServ.length > 0) {
        formServiceSelect.innerHTML = '<option value="">Select a service...</option>';
        activeServ.forEach(s => {
          const option = document.createElement("option");
          option.value = s.title;
          option.textContent = s.title;
          formServiceSelect.appendChild(option);
        });
      }
    }

    // ── Gallery Filterable Grid ──────────────────────────────
    const galleryGrid = document.getElementById("gallery-grid");
    const filterBar = document.getElementById("gallery-filter-bar");

    if (galleryGrid && filterBar) {
      const activeCases = cases
        .filter(c => c.isPublished !== false && c.mainImageId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      // Build unique category tabs from cases (using category field)
      const categories = [...new Set(activeCases.map(c => c.category).filter(Boolean))];
      
      // Build dynamic category map from live services list
      window._categoryMap = {};
      categories.forEach(cat => {
        window._categoryMap[cat] = getServiceTitleForCategory(cat, services) || formatCategoryName(cat);
      });

      categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "gallery-filter-btn";
        btn.dataset.filter = cat;
        btn.textContent = formatCategoryName(cat);
        filterBar.appendChild(btn);
      });

      // Store cases globally for lightbox navigation
      window._galleryCases = activeCases;
      window._galleryFilteredCases = activeCases;
      window._lightboxIdx = 0;

      // Render gallery cards
      function renderGallery(filteredCases) {
        window._galleryFilteredCases = filteredCases;
        galleryGrid.innerHTML = "";
        const emptyState = document.getElementById("gallery-empty-state");

        if (filteredCases.length === 0) {
          if (emptyState) { emptyState.style.display = ""; galleryGrid.appendChild(emptyState); }
          lucide.createIcons();
          return;
        }
        if (emptyState) emptyState.style.display = "none";

        filteredCases.forEach((c, idx) => {
          const imgSrc = AppServices.getFileThumb(c.mainImageId, 600, 72);
          const card = document.createElement("div");
          card.className = "gallery-card";
          card.dataset.idx = idx;
          card.innerHTML = `
            <img src="${imgSrc}" alt="${c.title}" loading="lazy">
            <div class="gallery-card-overlay">
              ${c.category ? `<span class="gallery-card-category">${formatCategoryName(c.category)}</span>` : ""}
              <p class="gallery-card-title">${c.title}</p>
            </div>`;
          card.addEventListener("click", () => openGalleryLightbox(idx));
          galleryGrid.appendChild(card);
        });
        lucide.createIcons();
      }

      renderGallery(activeCases);

      // Filter tab click handlers
      filterBar.querySelectorAll(".gallery-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          filterBar.querySelectorAll(".gallery-filter-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const filter = btn.dataset.filter;
          const filtered = filter === "all" ? activeCases : activeCases.filter(c => c.category === filter);
          renderGallery(filtered);
        });
      });

      // Lightbox nav buttons
      const lbPrev = document.getElementById("lightbox-prev");
      const lbNext = document.getElementById("lightbox-next");
      if (lbPrev) lbPrev.addEventListener("click", (e) => { e.stopPropagation(); openGalleryLightbox(window._lightboxIdx - 1); });
      if (lbNext) lbNext.addEventListener("click", (e) => { e.stopPropagation(); openGalleryLightbox(window._lightboxIdx + 1); });

      // Keyboard navigation
      document.addEventListener("keydown", (e) => {
        const lb = document.getElementById("gallery-lightbox");
        if (!lb || !lb.classList.contains("active")) return;
        if (e.key === "ArrowLeft") openGalleryLightbox(window._lightboxIdx - 1);
        if (e.key === "ArrowRight") openGalleryLightbox(window._lightboxIdx + 1);
        if (e.key === "Escape") lb.classList.remove("active");
      });
    }

    // ── Coordination Contacts (Case Transmission Station) ──────────────────
    const phoneLbl = document.getElementById("contact-detail-phone-lbl");
    const emailLbl = document.getElementById("contact-detail-email-lbl");
    const addressLbl = document.getElementById("contact-detail-address-lbl");
    
    if (phoneLbl && settings.phone) phoneLbl.innerText = settings.phone;
    if (emailLbl && settings.email) emailLbl.innerText = settings.email;
    if (addressLbl && settings.address) addressLbl.innerText = settings.address;

    // ── Setup Drag & Drop File Upload Listeners ─────────────────────────────
    const dropzone = document.getElementById("dropzone-area");
    if (dropzone) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--primary)";
        dropzone.style.backgroundColor = "var(--bg-secondary)";
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "var(--border)";
        dropzone.style.backgroundColor = "var(--bg-secondary)";
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--border)";
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processSelectedFile(e.dataTransfer.files[0]);
        }
      });
    }

    // ── Social links ────────────────────────────────────────────
    const fbLink = document.getElementById("footer-fb-link");
    const igLink = document.getElementById("footer-ig-link");
    if (fbLink && settings.facebookUrl) fbLink.href = settings.facebookUrl;
    if (igLink && settings.instagramUrl) igLink.href = settings.instagramUrl;

    lucide.createIcons();

  } catch (error) {
    console.error("Failed to load landing page data:", error);
    lucide.createIcons();
  }
}


// ── Gallery Lightbox ──────────────────────────────────────────
function openGalleryLightbox(idx) {
  const cases = window._galleryFilteredCases || [];
  if (!cases.length) return;

  // Clamp index (wrap around)
  if (idx < 0) idx = cases.length - 1;
  if (idx >= cases.length) idx = 0;
  window._lightboxIdx = idx;

  const c = cases[idx];
  const lb = document.getElementById("gallery-lightbox");
  const img = document.getElementById("lightbox-main-img");
  const catEl = document.getElementById("lightbox-category");
  const titleEl = document.getElementById("lightbox-title");

  if (!lb || !img) return;

  // Lightbox — high quality but capped at 1200px wide (saves ~70% vs original)
  img.src = AppServices.getFileView(c.mainImageId, 1200, 82);
  img.alt = c.title;
  if (catEl) catEl.textContent = formatCategoryName(c.category);
  if (titleEl) titleEl.textContent = c.title;

  lb.classList.add("active");
}

function closeGalleryLightbox(e) {
  // Only close if clicking on backdrop (not inner content)
  if (e.target === document.getElementById("gallery-lightbox")) {
    document.getElementById("gallery-lightbox").classList.remove("active");
  }
}

// Apply settings elements across public pages
function applySiteSettings(settings) {
  if (!settings) return;
  
  // Document SEO title
  document.title = settings.seoTitle || "Sharaf Dent Lab | Premium Dental Restorations";
  
  // Footer coordinates labels
  const footerPhone = document.getElementById("footer-phone-lbl");
  const footerEmail = document.getElementById("footer-email-lbl");
  const footerCopyright = document.getElementById("footer-copyright-lbl");
  const footerCopyrightDesc = document.getElementById("footer-copyright-desc");
  
  if (footerPhone) footerPhone.innerText = settings.phone;
  if (footerEmail) footerEmail.innerText = settings.email;
  if (footerCopyright) footerCopyright.innerText = settings.footerText || "";
  if (footerCopyrightDesc) footerCopyrightDesc.innerText = settings.seoDescription || "";
  
  // Update WhatsApp float link
  const waFloat = document.getElementById("whatsapp-float-btn");
  if (waFloat) {
    const cleanPhone = settings.whatsapp.replace(/\D/g, "");
    waFloat.href = `https://wa.me/${cleanPhone}`;
  }

  // Update website logo
  if (settings.logoImageId) {
    const logoSrc = AppServices.getFileView(settings.logoImageId, 200, 85);
    if (logoSrc) {
      document.querySelectorAll(".logo-img").forEach(img => {
        img.src = logoSrc;
      });
    }
  }

  // Update Hero Image
  if (settings.heroImageId) {
    const heroImg = document.getElementById("hero-img-el");
    if (heroImg) {
      const src = AppServices.getFileView(settings.heroImageId, 1400, 80);
      if (src) heroImg.src = src;
    }
  }

  // Update About Image
  if (settings.aboutImageId) {
    const aboutImg = document.getElementById("about-img-el");
    if (aboutImg) {
      const src = AppServices.getFileView(settings.aboutImageId, 900, 78);
      if (src) aboutImg.src = src;
    }
  }
}

// ----------------------------------------------------
// 4. Specialties Page loading (services.html)
// ----------------------------------------------------
async function loadServicesPage() {
  try {
    const [settings, services] = await Promise.all([
      pubGetSettings(),
      pubGetServices()
    ]);
    applySiteSettings(settings);

    const catalogGrid = document.getElementById("services-catalog-grid");
    if (catalogGrid) {
      catalogGrid.innerHTML = "";
      const activeServ = services.filter(s => s.isPublished !== false);
      
      if (activeServ.length === 0) {
        catalogGrid.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted);">No specialties catalog published yet.</div>`;
      } else {
        activeServ.forEach(s => {
          catalogGrid.innerHTML += `
            <div class="service-card">
              <div class="service-card-icon"><i data-lucide="${s.icon || 'Layers'}"></i></div>
              <h3>${s.title}</h3>
              <p>${s.shortDescription}</p>
              <a href="service-detail.html?slug=${s.slug}" class="service-card-link">Review specs sheet & Tolerances <i data-lucide="arrow-up-right"></i></a>
            </div>
          `;
        });
      }
    }
    
    lucide.createIcons();
  } catch (e) {
    console.error("Failed to load services catalog:", e);
  }
}

// ----------------------------------------------------
// 5. Service Detail Template loading (service-detail.html)
// ----------------------------------------------------
async function loadServiceDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");
  
  if (!slug) {
    window.location.href = "services.html";
    return;
  }

  try {
    const [settings, services] = await Promise.all([
      pubGetSettings(),
      pubGetServices()
    ]);
    applySiteSettings(settings);

    const matching = services.find(s => s.slug === slug);
    const loadingState = document.getElementById("service-loading-state");
    const contentWrapper = document.getElementById("service-content-wrapper");
    
    if (!matching) {
      if (loadingState) {
        loadingState.innerHTML = `<p style="color: var(--destructive); font-weight: 800;">Specialty Restoration not found in catalogs.</p>`;
      }
      return;
    }

    if (loadingState) loadingState.style.display = "none";
    if (contentWrapper) contentWrapper.style.display = "block";

    // Set page parameters
    document.title = matching.seoTitle || `${matching.title} | Sharaf Dent Lab`;
    
    const catLbl = document.getElementById("serv-detail-category");
    const titleLbl = document.getElementById("serv-detail-title");
    const shortDescLbl = document.getElementById("serv-detail-short-desc");
    const fullDescLbl = document.getElementById("serv-detail-full-desc");
    const mainImg = document.getElementById("serv-detail-img");
    
    if (catLbl) catLbl.innerText = matching.isFeatured ? "Featured Lab specialty" : "Standard Restoration specialty";
    if (titleLbl) titleLbl.innerText = matching.title;
    if (shortDescLbl) shortDescLbl.innerText = matching.shortDescription;
    if (fullDescLbl) fullDescLbl.innerHTML = matching.fullDescription.replace(/\n/g, "<br>");
    
    if (mainImg) {
      mainImg.src = matching.imageId ? AppServices.getFileView(matching.imageId, 900, 80) : "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800";
      mainImg.alt = matching.title;
    }

    // Bind WhatsApp pre-filled click
    const waBtn = document.getElementById("serv-detail-wa-btn");
    if (waBtn) {
      const cleanPhone = settings.whatsapp.replace(/\D/g, "");
      const msgText = `Hello Sharaf Dent Lab, I am interested in coordinating a patient case regarding: ${matching.title}. Please provide standard CAD specs guidelines!`;
      waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`;
    }

    lucide.createIcons();
  } catch (e) {
    console.error("Failed to load service details:", e);
  }
}

// ----------------------------------------------------
// 6. Portfolio Page loading (cases.html)
// ----------------------------------------------------
async function loadCasesPage() {
  try {
    const [settings, cases] = await Promise.all([
      pubGetSettings(),
      pubGetCases()
    ]);
    applySiteSettings(settings);

    const activeCases = cases.filter(c => c.isPublished !== false);
    renderPortfolioGrid(activeCases);
    
    // Bind filter buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        // Toggle active UI
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const cat = btn.getAttribute("data-category");
        if (cat === "all") {
          renderPortfolioGrid(activeCases);
        } else {
          const filtered = activeCases.filter(c => c.category === cat);
          renderPortfolioGrid(filtered);
        }
      });
    });
    
  } catch (e) {
    console.error("Failed to load cases portfolio page:", e);
  }
}

function renderPortfolioGrid(list) {
  const casesGrid = document.getElementById("cases-portfolio-grid");
  if (!casesGrid) return;
  
  casesGrid.innerHTML = "";
  if (list.length === 0) {
    casesGrid.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 48px;">No clinical case studies match this category filter.</div>`;
    return;
  }
  
  list.forEach(c => {
    const imgUrl = c.mainImageId ? AppServices.getFileThumb(c.mainImageId, 600, 75) : "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=600";
    casesGrid.innerHTML += `
      <div class="case-card">
        <div class="case-img-wrapper">
          <img src="${imgUrl}" alt="${c.title}">
          <span class="case-category-badge">${formatCategoryName(c.category)}</span>
        </div>
        <div class="case-card-body">
          <h3>${c.title}</h3>
          <p>${c.shortDescription}</p>
          <a href="case-detail.html?slug=${c.slug}" class="btn btn-secondary" style="margin-top: auto; font-size: 11px; padding: 10px 20px;">Review smile restoration</a>
        </div>
      </div>
    `;
  });
  
  lucide.createIcons();
}

// ----------------------------------------------------
// 7. Case Detail Page loading (case-detail.html)
// ----------------------------------------------------
async function loadCaseDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");
  
  if (!slug) {
    window.location.href = "cases.html";
    return;
  }

  try {
    const [settings, cases] = await Promise.all([
      pubGetSettings(),
      pubGetCases()
    ]);
    applySiteSettings(settings);

    const matching = cases.find(c => c.slug === slug);
    const loadingState = document.getElementById("case-loading-state");
    const contentWrapper = document.getElementById("case-content-wrapper");
    
    if (!matching) {
      if (loadingState) {
        loadingState.innerHTML = `<p style="color: var(--destructive); font-weight: 800;">Aesthetic Case study not found.</p>`;
      }
      return;
    }

    if (loadingState) loadingState.style.display = "none";
    if (contentWrapper) contentWrapper.style.display = "block";

    // Set title and labels
    document.title = matching.seoTitle || `${matching.title} | Sharaf Dent Lab`;
    
    const catLbl = document.getElementById("case-detail-category");
    const titleLbl = document.getElementById("case-detail-title");
    const shortDescLbl = document.getElementById("case-detail-short-desc");
    const fullDescLbl = document.getElementById("case-detail-full-desc");
    
    if (catLbl) catLbl.innerText = `${formatCategoryName(matching.category)} Restorative Case study`;
    if (titleLbl) titleLbl.innerText = matching.title;
    if (shortDescLbl) shortDescLbl.innerText = matching.shortDescription;
    if (fullDescLbl) fullDescLbl.innerHTML = matching.fullDescription.replace(/\n/g, "<br>");
    
    // Set spec sheet focus label
    const focusLbl = document.getElementById("case-spec-focus");
    if (focusLbl) focusLbl.innerText = formatCategoryName(matching.category);

    // Load double before/after compare slides
    const compWrapper = document.getElementById("case-comparative-wrapper");
    const singleWrapper = document.getElementById("case-single-img-wrapper");
    
    if (matching.beforeImageId && matching.afterImageId) {
      if (compWrapper) compWrapper.style.display = "grid";
      if (singleWrapper) singleWrapper.style.display = "none";
      
      const beforeImg = document.getElementById("case-before-img");
      const afterImg = document.getElementById("case-after-img");
      
      if (beforeImg) beforeImg.src = AppServices.getFileView(matching.beforeImageId, 1000, 80);
      if (afterImg) afterImg.src = AppServices.getFileView(matching.afterImageId, 1000, 80);
    } else {
      // Fallback to single main image
      if (compWrapper) compWrapper.style.display = "none";
      if (singleWrapper) singleWrapper.style.display = "block";
      
      const singleImg = document.getElementById("case-single-img");
      if (singleImg) singleImg.src = matching.mainImageId ? AppServices.getFileView(matching.mainImageId, 1000, 80) : "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80&w=800";
    }

    // Supplementary Scan collage gallery uploader list
    const gallerySec = document.getElementById("case-gallery-section");
    const collage = document.getElementById("case-gallery-collage");
    
    if (gallerySec && collage && matching.galleryImageIds && matching.galleryImageIds.length > 0) {
      gallerySec.style.display = "block";
      collage.innerHTML = "";
      
      matching.galleryImageIds.forEach(fid => {
        if (!fid) return;
        const imgUrl = AppServices.getFileView(fid, 800, 78);
        collage.innerHTML += `
          <div class="gallery-thumbnail" onclick="openLightboxImage('${imgUrl}')">
            <img src="${imgUrl}" alt="Case angle scan">
          </div>
        `;
      });
    }

    // Bind Lightbox closer
    const lightbox = document.getElementById("case-lightbox");
    const closeBtn = document.getElementById("lightbox-close-btn");
    if (lightbox && closeBtn) {
      closeBtn.addEventListener("click", () => {
        lightbox.style.display = "none";
      });
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) lightbox.style.display = "none";
      });
    }

    // WhatsApp Call to Action
    const waBtn = document.getElementById("case-detail-wa-btn");
    if (waBtn) {
      const cleanPhone = settings.whatsapp.replace(/\D/g, "");
      const msgText = `Hello Sharaf Dent Lab, I am looking at your Case transformation Study: "${matching.title}". Can we collaborate on a similar patient diagnosis?`;
      waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`;
    }

    lucide.createIcons();
  } catch (e) {
    console.error("Failed to load case detail profiles:", e);
  }
}

// Lightbox controller
function openLightboxImage(url) {
  const lightbox = document.getElementById("case-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  
  if (lightbox && lightboxImg) {
    lightboxImg.src = url;
    lightbox.style.display = "flex";
  }
}

// ----------------------------------------------------
// 8. Case Digital Form loading (contact.html)
// ----------------------------------------------------
let attachedFile = null;

async function loadContactPage() {
  try {
    const settings = await pubGetSettings();
    applySiteSettings(settings);
    
    // Apply contact text values
    const phoneLbl = document.getElementById("contact-detail-phone-lbl");
    const emailLbl = document.getElementById("contact-detail-email-lbl");
    const addressLbl = document.getElementById("contact-detail-address-lbl");
    
    if (phoneLbl) phoneLbl.innerText = settings.phone;
    if (emailLbl) emailLbl.innerText = settings.email;
    if (addressLbl) addressLbl.innerText = settings.address;
    
    // Setup drag and drop events
    const dropzone = document.getElementById("dropzone-area");
    if (dropzone) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--primary)";
        dropzone.style.backgroundColor = "var(--bg-secondary)";
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "var(--border)";
        dropzone.style.backgroundColor = "var(--bg-secondary)";
      });
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--border)";
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processSelectedFile(e.dataTransfer.files[0]);
        }
      });
    }
  } catch (e) {
    console.error("Failed to load contact parameters:", e);
  }
}

function triggerFileInput() {
  const input = document.getElementById("scan-file-input");
  if (input) input.click();
}

function handleFileSelected(event) {
  if (event.target.files && event.target.files.length > 0) {
    processSelectedFile(event.target.files[0]);
  }
}

function processSelectedFile(file) {
  if (file.size > 20 * 1024 * 1024) {
    alert("Scan file size exceeds the maximum 20MB limit allowed.");
    return;
  }
  
  attachedFile = file;
  
  const dropzone = document.getElementById("dropzone-area");
  const preview = document.getElementById("file-attached-preview");
  const nameLbl = document.getElementById("preview-filename");
  const sizeLbl = document.getElementById("preview-filesize");
  
  if (dropzone) dropzone.style.display = "none";
  if (preview) preview.style.display = "block";
  if (nameLbl) nameLbl.innerText = file.name;
  if (sizeLbl) sizeLbl.innerText = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  
  lucide.createIcons();
}

function removeAttachedFile() {
  attachedFile = null;
  
  const dropzone = document.getElementById("dropzone-area");
  const preview = document.getElementById("file-attached-preview");
  const input = document.getElementById("scan-file-input");
  
  if (dropzone) dropzone.style.display = "flex";
  if (preview) preview.style.display = "none";
  if (input) input.value = "";
}

// Form Submit Coordinator
async function handlePrescriptionSubmit(event) {
  event.preventDefault();
  
  const errorAlert = document.getElementById("rx-error-alert");
  const errorMsg = document.getElementById("rx-error-msg");
  const submitBtn = document.getElementById("rx-submit-btn");
  
  if (errorAlert) errorAlert.style.display = "none";
  
  // Extract inputs
  const name = document.getElementById("doctor-name").value.trim();
  const phone = document.getElementById("doctor-phone").value.trim();
  const email = document.getElementById("doctor-email").value.trim();
  const clinicName = document.getElementById("clinic-name").value.trim();
  const serviceType = document.getElementById("restoration-type").value;
  const message = document.getElementById("case-instructions").value.trim();
  
  if (!name || !phone || !email || !message) {
    if (errorAlert && errorMsg) {
      errorMsg.innerText = "Please complete all required fields (*).";
      errorAlert.style.display = "flex";
    }
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Uploading scans & Transmitting case...`;
      lucide.createIcons();
    }

    let fileId = "";
    if (attachedFile) {
      fileId = await AppServices.uploadFile(attachedFile);
    }

    // Save case data
    await AppServices.createMessage({
      name,
      phone,
      email,
      clinicName,
      serviceType,
      message,
      uploadedFileId: fileId
    });

    // Toggle success landing
    const formCard = document.getElementById("prescription-form-card");
    const successCard = document.getElementById("prescription-success-card");
    
    if (formCard) formCard.style.display = "none";
    if (successCard) successCard.style.display = "block";
    
  } catch (error) {
    console.error("Prescription submit error:", error);
    if (errorAlert && errorMsg) {
      errorMsg.innerText = error.message || "Failed to submit case online. Please check network coordinates.";
      errorAlert.style.display = "flex";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send"></i> Submit Case to Lab`;
      lucide.createIcons();
    }
  }
}

function resetPrescriptionForm() {
  const formCard = document.getElementById("prescription-form-card");
  const successCard = document.getElementById("prescription-success-card");
  const form = document.getElementById("contact-rx-form");
  
  if (form) form.reset();
  removeAttachedFile();
  
  if (formCard) formCard.style.display = "block";
  if (successCard) successCard.style.display = "none";
}

// ----------------------------------------------------
// Sheets Contact Form Submission Engine
// ----------------------------------------------------
function initSheetsContactForm() {
  const contactForm = document.getElementById("sheets-contact-form");
  if (!contactForm) return;

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById("form-submit-btn");
    const feedbackEl = document.getElementById("form-feedback");
    
    const doctorName = document.getElementById("form-doctor-name").value.trim();
    const phone = document.getElementById("form-phone").value.trim();
    const service = document.getElementById("form-service").value;
    const message = document.getElementById("form-message").value.trim();
    
    if (!doctorName || !phone) {
      showFeedback("Please fill out all required fields.", "error");
      return;
    }
    
    // Check if configuration exists
    const appsScriptUrl = typeof CONTACT_FORM_CONFIG !== 'undefined' ? CONTACT_FORM_CONFIG.googleAppsScriptUrl : '';
    if (!appsScriptUrl || appsScriptUrl === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      console.error("Google Apps Script URL is not configured in config.js.");
      showFeedback("Submit failed: Google Sheets URL is not configured. Please contact the administrator.", "error");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        doctorName,
        phone,
        service,
        message
      };
      
      await fetch(appsScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      
      showFeedback("Thank you! Your message has been sent successfully.", "success");
      contactForm.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      showFeedback("Failed to send message. Please check your connection and try again.", "error");
    } finally {
      setSubmitting(false);
    }
    
    function setSubmitting(isSubmitting) {
      if (isSubmitting) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> <span>Sending...</span>`;
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send Message</span>`;
      }
    }
    
    function showFeedback(msg, type) {
      feedbackEl.innerText = msg;
      feedbackEl.style.display = "block";
      if (type === "success") {
        feedbackEl.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        feedbackEl.style.color = "var(--success)";
        feedbackEl.style.border = "1px solid var(--success)";
      } else {
        feedbackEl.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
        feedbackEl.style.color = "var(--destructive)";
        feedbackEl.style.border = "1px solid var(--destructive)";
      }
    }
  });
}

// ----------------------------------------------------
// 5. Scroll Spy Navigation Highlighter (Active Link state on scroll)
// ----------------------------------------------------
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  
  if (!sections.length || !navLinks.length) return;
  
  const handleScroll = () => {
    let currentId = "";
    // Offset standard scroll position by header height + some padding
    const scrollPosition = window.scrollY + 120;
    
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = section.getAttribute("id");
      }
    });
    
    // Fallback: If at the top of the page, highlight hero-sec (Home)
    if (window.scrollY < 80) {
      currentId = "hero-sec";
    }
    
    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        }
      });
    }
  };
  
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Trigger once on load
  
  // Update instantly on click for better UX
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      const navMenu = document.getElementById("nav-menu");
      if (navMenu) {
        navMenu.classList.remove("show");
      }
    });
  });
}
