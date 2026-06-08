// ----------------------------------------------------
// SHARAF DENT LAB - Admin Dashboard CMS Engine
// ----------------------------------------------------

let activeAdminTab = "settings";
let currentCrudCollection = "";

// Global caches
let currentSettings = null;
let currentServices = [];
let currentCases = [];
let currentWhyUs = [];
let currentProcessSteps = [];
let currentMessages = [];

document.addEventListener("DOMContentLoaded", async () => {
  initThemeEngine();
  
  // Verify administrative session
  const isLoggedIn = await AppServices.isLoggedIn();
  if (isLoggedIn) {
    showAdminWorkspace();
  } else {
    showLoginArea();
  }
});

// ----------------------------------------------------
// 1. Session Auth Screens togglers
// ----------------------------------------------------
function showLoginArea() {
  document.getElementById("admin-login-area").style.display = "flex";
  document.getElementById("admin-workspace-area").style.display = "none";
}

function showAdminWorkspace() {
  document.getElementById("admin-login-area").style.display = "none";
  document.getElementById("admin-workspace-area").style.display = "flex";
  
  // Hydrate full CMS workspace
  switchAdminTab("settings");
  
  // Render Lucide icons for the newly visible workspace
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Handle administrative login
async function handleAdminLogin(event) {
  event.preventDefault();
  
  const errorAlert = document.getElementById("login-error-alert");
  const errorMsg = document.getElementById("login-error-msg");
  const submitBtn = document.getElementById("login-submit-btn");
  
  if (errorAlert) errorAlert.style.display = "none";
  
  let email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  
  if (email.toLowerCase() === "admin") {
    email = "admin@sharafdent.com";
  }
  
  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Authenticating Admin Session...";
    }
    
    await AppServices.login(email, password);
    showAdminWorkspace();
    showToast("Session authenticated successfully! Welcome back.", true);
  } catch (error) {
    console.error("Login failed:", error);
    if (errorAlert && errorMsg) {
      errorMsg.innerText = error.message || "Failed to log in. Please check clinical network status.";
      errorAlert.style.display = "flex";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Authenticate Session";
    }
  }
}

// Bypass authentication to use local MockDB sandbox
async function bypassToMockDB() {
  localStorage.setItem("sharafdent_session", "true");
  localStorage.setItem("sharafdent_sandbox_mode", "true");
  showAdminWorkspace();
  showToast("Logged in using local sandbox database!", true);
}

// Handle Admin Sign Out
async function handleAdminLogout() {
  await AppServices.logout();
  showLoginArea();
  showToast("Session disconnected. Goodbye!", true);
}

// ----------------------------------------------------
// 2. Tabs Switcher & Data hydration
// ----------------------------------------------------
async function switchAdminTab(tabKey) {
  activeAdminTab = tabKey;
  
  // Update Title Headers
  const titleLbl = document.getElementById("current-panel-title");
  if (titleLbl) {
    titleLbl.innerText = tabKey.charAt(0).toUpperCase() + tabKey.slice(1).replace("-", " ") + " Panel";
    if (tabKey === "overview") titleLbl.innerText = "Control Room Overview";
  }

  // Toggle active Sidebar classes
  const menuLinks = document.querySelectorAll(".admin-menu-link");
  menuLinks.forEach(link => {
    if (link.innerText.toLowerCase().includes(tabKey.replace("-", " "))) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Toggle active tab panel view divs
  const panels = document.querySelectorAll(".admin-tab-panel");
  panels.forEach(panel => {
    if (panel.id === `admin-panel-${tabKey}`) {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  });

  // Close mobile sidebar drawer when a tab is switched
  if (window.innerWidth <= 768 && typeof closeAdminSidebar === 'function') {
    closeAdminSidebar();
  }

  // Load and populate the active Tab Data
  loadTabContent(tabKey);
}

async function loadTabContent(tabKey) {
  try {
    switch (tabKey) {
      case "overview":
        await loadOverviewMetrics();
        break;
      case "settings":
        await loadSettingsPanel();
        break;
      case "media":
        await loadMediaPanel();
        break;
      case "why-us":
        await loadWhyUsPanel();
        break;
      case "services":
        await loadServicesPanel();
        break;
      case "cases":
        await loadCasesPanel();
        break;
      case "pricelist":
        await loadPricelistPanel();
        break;
    }
  } catch (error) {
    console.error(`Failed to load admin tab [${tabKey}]:`, error);
    showToast("Failed to fetch fresh data coordinates.", false);
  }
}

// ----------------------------------------------------
// 3. Tab Hydrators: Settings & Metrics
// ----------------------------------------------------
async function loadOverviewMetrics() {
  const [services, cases, steps] = await Promise.all([
    AppServices.getServices(),
    AppServices.getCases(),
    AppServices.getProcessSteps()
  ]);

  document.getElementById("stat-services-count").innerText = services.length;
  document.getElementById("stat-cases-count").innerText = cases.length;
  document.getElementById("stat-process-count").innerText = steps.length;

  lucide.createIcons();
}

async function loadSettingsPanel() {
  currentSettings = await AppServices.getSettings();
  
  document.getElementById("set-site-name").value = currentSettings.siteName || "";
  document.getElementById("set-footer-text").value = currentSettings.footerText || "";
  document.getElementById("set-phone").value = currentSettings.phone || "";
  document.getElementById("set-whatsapp").value = currentSettings.whatsapp || "";
  document.getElementById("set-email").value = currentSettings.email || "";
  document.getElementById("set-facebook").value = currentSettings.facebookUrl || "";
  document.getElementById("set-address").value = currentSettings.address || "";
  document.getElementById("set-seo-title").value = currentSettings.seoTitle || "";
  document.getElementById("set-seo-desc").value = currentSettings.seoDescription || "";
}

async function handleSettingsUpdate(event) {
  event.preventDefault();
  
  const saveBtn = document.getElementById("settings-save-btn");
  const data = {
    siteName: document.getElementById("set-site-name").value.trim(),
    footerText: document.getElementById("set-footer-text").value.trim(),
    phone: document.getElementById("set-phone").value.trim(),
    whatsapp: document.getElementById("set-whatsapp").value.trim(),
    email: document.getElementById("set-email").value.trim(),
    facebookUrl: document.getElementById("set-facebook").value.trim(),
    address: document.getElementById("set-address").value.trim(),
    seoTitle: document.getElementById("set-seo-title").value.trim(),
    seoDescription: document.getElementById("set-seo-desc").value.trim()
  };

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = "Saving settings...";
    }
    
    await AppServices.updateSettings(currentSettings.$id, data);
    // Bust public site cache so next visitor sees the new settings
    if (typeof PubCache !== 'undefined') PubCache.bust();
    showToast("Settings coordinates updated successfully! Brand changes are live.", true);
  } catch (error) {
    console.error(error);
    showToast("Failed to save settings. Please verify inputs.", false);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-lucide="save"></i> Save Global brand Config`;
      lucide.createIcons();
    }
  }
}

// ----------------------------------------------------
// 4. Tab Hydrators: Media & Website Images Panel
// ----------------------------------------------------
async function loadMediaPanel() {
  currentSettings = await AppServices.getSettings();
  
  const logoUrlInput = document.getElementById("media-logo-url");
  const heroUrlInput = document.getElementById("media-hero-url");
  const aboutUrlInput = document.getElementById("media-about-url");
  
  if (logoUrlInput) logoUrlInput.value = currentSettings.logoImageId || "";
  if (heroUrlInput) heroUrlInput.value = currentSettings.heroImageId || "";
  if (aboutUrlInput) aboutUrlInput.value = currentSettings.aboutImageId || "";
  
  // Clear file inputs
  document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
  // Hide success labels
  document.querySelectorAll('[id$="-upload-status"]').forEach(span => span.style.display = "none");

  updateMediaPreviews();
}

function updateMediaPreviews() {
  const logoUrl = document.getElementById("media-logo-url").value.trim();
  const heroUrl = document.getElementById("media-hero-url").value.trim();
  const aboutUrl = document.getElementById("media-about-url").value.trim();
  
  const logoPreview = document.getElementById("logo-preview-img");
  const heroPreview = document.getElementById("hero-preview-img");
  const aboutPreview = document.getElementById("about-preview-img");
  
  if (logoPreview) {
    logoPreview.src = logoUrl ? AppServices.getFileView(logoUrl) : "pic/sharaf_logo.png";
  }
  if (heroPreview) {
    heroPreview.src = heroUrl ? AppServices.getFileView(heroUrl) : "pic/sharaf_pic.png";
  }
  if (aboutPreview) {
    aboutPreview.src = aboutUrl ? AppServices.getFileView(aboutUrl) : "pic/E-MAX.png";
  }
}

async function uploadImageField(fieldKey) {
  const fileInput = document.getElementById(`media-${fieldKey}-file`);
  const statusEl = document.getElementById(`${fieldKey}-upload-status`);
  const urlInput = document.getElementById(`media-${fieldKey}-url`);
  
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
  
  const file = fileInput.files[0];
  if (statusEl) {
    statusEl.style.display = "inline-block";
    statusEl.style.color = "var(--text-muted)";
    statusEl.innerText = "Uploading to storage...";
  }
  
  try {
    let fileId;
    const isCloud = await AppServices.checkCloud();
    if (isCloud) {
      fileId = await AppServices.uploadFile(file);
    } else {
      // Offline MockDB: Base64 data URL string upload
      fileId = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }
    
    if (urlInput) {
      urlInput.value = fileId;
    }
    
    updateMediaPreviews();
    
    if (statusEl) {
      statusEl.style.color = "var(--success)";
      statusEl.innerText = "Uploaded successfully!";
    }
  } catch (error) {
    console.error("Image upload failed:", error);
    if (statusEl) {
      statusEl.style.color = "var(--destructive)";
      statusEl.innerText = "Upload failed!";
    }
  }
}

async function handleMediaUpdate(event) {
  event.preventDefault();
  
  const saveBtn = document.getElementById("media-save-btn");
  const data = {
    logoImageId: document.getElementById("media-logo-url").value.trim(),
    heroImageId: document.getElementById("media-hero-url").value.trim(),
    aboutImageId: document.getElementById("media-about-url").value.trim()
  };
  
  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = "Saving images...";
    }
    
    await AppServices.updateSettings(currentSettings.$id, data);
    if (typeof PubCache !== 'undefined') PubCache.bust();
    showToast("Website images updated successfully! Changes are live.", true);
  } catch (error) {
    console.error(error);
    showToast("Failed to save website images. Please try again.", false);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-lucide="save"></i> Save Website Images`;
      lucide.createIcons();
    }
  }
}

// ----------------------------------------------------
// 5. Why Choose Us & Process Timeline CRUD Tab Panel
// ----------------------------------------------------
async function loadWhyUsPanel() {
  currentWhyUs = await AppServices.getWhyUs();
  const tbody = document.getElementById("why-us-table-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";
  
  if (currentWhyUs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No metrics created yet.</td></tr>`;
    return;
  }

  currentWhyUs.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.order}</strong></td>
        <td><strong>${item.title}</strong></td>
        <td style="font-size: 12px; color: var(--text-secondary);">${item.description}</td>
        <td><i data-lucide="${item.icon || 'Sparkles'}" style="width: 16px; height: 16px; color: var(--primary);"></i></td>
        <td>
          <div class="table-actions">
            <button class="action-btn" onclick="editCrudDocument('whyUs', '${item.$id}')" title="Edit Card"><i data-lucide="edit-3"></i></button>
            <button class="action-btn action-btn-danger" onclick="deleteCrudDocument('whyUs', '${item.$id}')" title="Delete Card"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
  
  lucide.createIcons();
}

async function loadProcessPanel() {
  currentProcessSteps = await AppServices.getProcessSteps();
  const tbody = document.getElementById("process-table-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";
  
  if (currentProcessSteps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No workflow steps constructed yet.</td></tr>`;
    return;
  }

  currentProcessSteps.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.order}</strong></td>
        <td><strong>${item.title}</strong></td>
        <td style="font-size: 12px; color: var(--text-secondary);">${item.description}</td>
        <td><i data-lucide="${item.icon || 'Activity'}" style="width: 16px; height: 16px; color: var(--primary);"></i></td>
        <td>
          <div class="table-actions">
            <button class="action-btn" onclick="editCrudDocument('processSteps', '${item.$id}')" title="Edit Step"><i data-lucide="edit-3"></i></button>
            <button class="action-btn action-btn-danger" onclick="deleteCrudDocument('processSteps', '${item.$id}')" title="Delete Step"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// ----------------------------------------------------
// 6. Specialties CRUD Panel Tab Hydrator
// ----------------------------------------------------
async function loadServicesPanel() {
  currentServices = await AppServices.getServices();
  const tbody = document.getElementById("services-table-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  if (currentServices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No services specialties created.</td></tr>`;
    return;
  }

  currentServices.forEach(item => {
    const isFeaturedBadge = item.isFeatured ? '<span class="badge" style="background-color: rgba(var(--primary), 0.1); color: var(--primary);">Featured</span>' : '<span style="color: var(--text-muted); font-size: 11px;">Standard</span>';
    const isPubBadge = item.isPublished ? '<span class="badge" style="background-color: rgba(16, 185, 129, 0.1); color: var(--success);">Live</span>' : '<span class="badge" style="background-color: var(--bg-secondary); color: var(--text-muted);">Draft</span>';
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.order}</strong></td>
        <td><strong>${item.title}</strong></td>
        <td>${isPubBadge}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn" onclick="editCrudDocument('services', '${item.$id}')" title="Edit Specialty"><i data-lucide="edit-3"></i></button>
            <button class="action-btn action-btn-danger" onclick="deleteCrudDocument('services', '${item.$id}')" title="Delete Specialty"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}

// ----------------------------------------------------
// 7. Portfolio Cases CRUD Panel Tab Hydrator
// ----------------------------------------------------
async function loadCasesPanel() {
  currentCases = await AppServices.getCases();
  currentServices = await AppServices.getServices(); // Ensure services are loaded for the dropdown

  const tbody = document.getElementById("cases-table-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  if (currentCases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No cases gallery items published yet.</td></tr>`;
    return;
  }

  currentCases.forEach(item => {
    const isPubBadge = item.isPublished ? '<span class="badge" style="background-color: rgba(16, 185, 129, 0.1); color: var(--success);">Live</span>' : '<span class="badge" style="background-color: var(--bg-secondary); color: var(--text-muted);">Draft</span>';
    const categoryBadge = item.category
      ? `<span class="badge" style="background: rgba(37,99,235,0.12); color: var(--primary); border: 1px solid rgba(37,99,235,0.2);">${item.category}</span>`
      : `<span style="color: var(--text-muted); font-size: 11px;">—</span>`;
    
    tbody.innerHTML += `
      <tr>
        <td><strong>${item.order}</strong></td>
        <td><strong>${item.title}</strong></td>
        <td>${categoryBadge}</td>
        <td>${isPubBadge}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn" onclick="editCrudDocument('cases', '${item.$id}')" title="Edit Case Study"><i data-lucide="edit-3"></i></button>
            <button class="action-btn action-btn-danger" onclick="deleteCrudDocument('cases', '${item.$id}')" title="Delete Case Study"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  lucide.createIcons();
}



// ----------------------------------------------------
// 9. DYNAMIC DUAL SYSTEM CRUD CREATOR (popup builder)
// ----------------------------------------------------
let activeFileUploaderBindings = {};

function openCrudModal(collectionKey) {
  currentCrudCollection = collectionKey;
  
  const modal = document.getElementById("crud-modal-popup");
  const modalTitle = document.getElementById("crud-modal-title");
  const fieldsContainer = document.getElementById("crud-form-fields-container");
  
  if (!modal || !fieldsContainer) return;

  // Reset uploader state
  activeFileUploaderBindings = {};

  // Form Reset
  document.getElementById("crud-item-id").value = "";
  document.getElementById("crud-collection-key").value = collectionKey;
  fieldsContainer.innerHTML = "";

  // Dynamic panel setup
  switch (collectionKey) {
    case "whyUs":
      modalTitle.innerText = "Add Homepage Value Card";
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label class="form-label">Card Title</label>
          <input type="text" id="why-title" required class="form-control" placeholder="Micron-Level Tolerance">
        </div>
        <div class="form-group">
          <label class="form-label">Card Description</label>
          <textarea id="why-desc" required class="form-control" rows="3" placeholder="Description of value pillar..."></textarea>
        </div>
        <div class="form-group-grid">
          <div class="form-group">
            <label class="form-label">Lucide Icon name</label>
            <select id="why-icon" class="form-control" style="appearance: auto;">
              <option value="Shield">Shield</option>
              <option value="Sparkles">Sparkles</option>
              <option value="Activity">Activity</option>
              <option value="Layers">Layers</option>
              <option value="HelpCircle">HelpCircle</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Order Index</label>
            <input type="number" id="why-order" class="form-control" value="0">
          </div>
        </div>
      `;
      break;

    case "processSteps":
      modalTitle.innerText = "Add Timeline Workflow Step";
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label class="form-label">Step Title</label>
          <input type="text" id="proc-title" required class="form-control" placeholder="Digital Impression">
        </div>
        <div class="form-group">
          <label class="form-label">Step Description</label>
          <textarea id="proc-desc" required class="form-control" rows="3" placeholder="Workflow step process instructions..."></textarea>
        </div>
        <div class="form-group-grid">
          <div class="form-group">
            <label class="form-label">Lucide Icon name</label>
            <select id="proc-icon" class="form-control" style="appearance: auto;">
              <option value="Camera">Camera</option>
              <option value="Layers">Layers</option>
              <option value="Activity">Activity</option>
              <option value="Sparkles">Sparkles</option>
              <option value="Shield">Shield</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Order Index</label>
            <input type="number" id="proc-order" class="form-control" value="0">
          </div>
        </div>
      `;
      break;

    case "services":
      modalTitle.innerText = "Add Restoration Specialty";
      fieldsContainer.innerHTML = `
        <div class="form-group-grid">
          <div class="form-group">
            <label class="form-label">Service Name</label>
            <input type="text" id="serv-title" required class="form-control" placeholder="Fixed Zirconia Restorations">
          </div>
          <div class="form-group">
            <label class="form-label">Order Index</label>
            <input type="number" id="serv-order" class="form-control" value="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Service Features (One per line)</label>
          <textarea id="serv-full-desc" required class="form-control" rows="5" placeholder="Titanium Bar\nPremium Teeth\nCustom Abutments"></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Service Image</label>
          <div class="admin-upload-grid">
            <div class="admin-upload-box" onclick="triggerAdminUploader('serv-image')">
              <input type="file" id="serv-image-input" style="display: none;" accept="image/*" onchange="handleAdminFileSelected('serv-image', event)">
              <img id="serv-image-preview" src="" style="display: none;">
              <span id="serv-image-lbl">Upload Image</span>
            </div>
          </div>
        </div>

        <div class="form-group-grid" style="margin-top: 16px;">
          <div class="form-group">
            <label class="switch-control">
              <input type="checkbox" id="serv-published" class="switch-checkbox" checked>
              <span class="switch-indicator"></span>
              <span class="form-label" style="margin-bottom: 0;">Publish live</span>
            </label>
          </div>
        </div>
      `;
      break;

    case "cases":
      modalTitle.innerText = "Add Gallery Case Image";
      // Build service list for category dropdown
      const servicesForDropdown = (typeof currentServices !== 'undefined' && currentServices.length > 0)
        ? currentServices.map(s => `<option value="${s.title}">${s.title}</option>`).join("")
        : `<option value="Zirconia">Zirconia</option><option value="All-on-X">All-on-X</option><option value="E.max">E.max</option>`;

      fieldsContainer.innerHTML = `
        <div class="form-group-grid">
          <div class="form-group">
            <label class="form-label">Image Title</label>
            <input type="text" id="case-title" required class="form-control" placeholder="e.g. Full Arch Smile Rehabilitation">
          </div>
          <div class="form-group">
            <label class="form-label">Order Index</label>
            <input type="number" id="case-order" class="form-control" value="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Service Category <span style="color:var(--primary); font-size:10px; font-weight:600; margin-left:4px;">Used for gallery filter tabs</span></label>
          <select id="case-category" class="form-control" style="appearance: auto;">
            <option value="">— No Category —</option>
            ${servicesForDropdown}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Gallery Image</label>
          <div class="admin-upload-grid">
            <div class="admin-upload-box" onclick="triggerAdminUploader('case-main')">
              <input type="file" id="case-main-input" style="display: none;" accept="image/*" onchange="handleAdminFileSelected('case-main', event)">
              <img id="case-main-preview" src="" style="display: none; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
              <span id="case-main-lbl">Click to Upload Case Image</span>
            </div>
          </div>
        </div>

        <div class="form-group-grid" style="margin-top: 16px;">
          <div class="form-group">
            <label class="switch-control">
              <input type="checkbox" id="case-published" class="switch-checkbox" checked>
              <span class="switch-indicator"></span>
              <span class="form-label" style="margin-bottom: 0;">Publish live</span>
            </label>
          </div>
        </div>
      `;
      break;
  }

  modal.style.display = "flex";
  lucide.createIcons();
}

function closeCrudModal() {
  document.getElementById("crud-modal-popup").style.display = "none";
}

function triggerCrudSubmit() {
  const btn = document.getElementById("crud-form-hidden-submit");
  if (btn) btn.click();
}

// Auto slugify helper
function autoSlugify(text, targetInputId) {
  const input = document.getElementById(targetInputId);
  if (input) {
    input.value = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
}

// ----------------------------------------------------
// 10. Uploader click handlers inside modals
// ----------------------------------------------------
function triggerAdminUploader(key) {
  const input = document.getElementById(`${key}-input`);
  if (input) input.click();
}

function handleAdminFileSelected(key, event) {
  if (event.target.files && event.target.files.length > 0) {
    const file = event.target.files[0];
    
    // Cache the File Object to be uploaded on form Submit
    activeFileUploaderBindings[key] = file;
    
    // Render local preview instantly
    const preview = document.getElementById(`${key}-preview`);
    const label = document.getElementById(`${key}-lbl`);
    
    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
    if (label) label.style.display = "none";
  }
}

// ----------------------------------------------------
// 11. MODAL CRUD HANDLERS: Form Submit
// ----------------------------------------------------
async function handleCrudFormSubmit(event) {
  event.preventDefault();
  
  const idVal = document.getElementById("crud-item-id").value;
  const colKey = document.getElementById("crud-collection-key").value;
  const isEditing = idVal !== "";

  try {
    showToast("Committing database transaction...", true);
    
    // 1. Process active image uploads first
    let uploadedFileIds = {};
    for (const key of Object.keys(activeFileUploaderBindings)) {
      const file = activeFileUploaderBindings[key];
      const fid = await AppServices.uploadFile(file);
      uploadedFileIds[key] = fid;
    }

    // 2. Map payload dynamically
    let payload = {};
    
    if (colKey === "whyUs") {
      payload = {
        title: document.getElementById("why-title").value.trim(),
        description: document.getElementById("why-desc").value.trim(),
        icon: document.getElementById("why-icon").value,
        order: parseInt(document.getElementById("why-order").value) || 0,
        isPublished: true
      };
    } else if (colKey === "processSteps") {
      payload = {
        title: document.getElementById("proc-title").value.trim(),
        description: document.getElementById("proc-desc").value.trim(),
        icon: document.getElementById("proc-icon").value,
        order: parseInt(document.getElementById("proc-order").value) || 0,
        isPublished: true
      };
    } else if (colKey === "services") {
      payload = {
        title: document.getElementById("serv-title").value.trim(),
        slug: "",
        shortDescription: "",
        fullDescription: document.getElementById("serv-full-desc").value.trim(),
        order: parseInt(document.getElementById("serv-order").value) || 0,
        icon: "",
        isFeatured: false,
        isPublished: true,
      };
      
      // Update image only if uploaded
      if (uploadedFileIds["serv-image"]) {
        payload.imageId = uploadedFileIds["serv-image"];
      }
    } else if (colKey === "cases") {
      payload = {
        title: document.getElementById("case-title").value.trim(),
        slug: "",
        category: document.getElementById("case-category") ? document.getElementById("case-category").value : "",
        shortDescription: "",
        fullDescription: "",
        order: parseInt(document.getElementById("case-order").value) || 0,
        isFeatured: false,
        isPublished: true,
      };

      if (uploadedFileIds["case-main"]) payload.mainImageId = uploadedFileIds["case-main"];
    }

    // 3. Database CRUD Commit
    if (isEditing) {
      if (colKey === "whyUs") await AppServices.updateWhyUs(idVal, payload);
      else if (colKey === "processSteps") await AppServices.updateProcessStep(idVal, payload);
      else if (colKey === "services") await AppServices.updateService(idVal, payload);
      else if (colKey === "cases") await AppServices.updateCase(idVal, payload);
      showToast("Document updated successfully!", true);
    } else {
      if (colKey === "whyUs") await AppServices.createWhyUs(payload);
      else if (colKey === "processSteps") await AppServices.createProcessStep(payload);
      else if (colKey === "services") await AppServices.createService(payload);
      else if (colKey === "cases") await AppServices.createCase(payload);
      showToast("Document created successfully! Live live.", true);
    }

    // Bust public cache so the website reflects changes immediately
    if (typeof PubCache !== 'undefined') PubCache.bust();

    closeCrudModal();
    loadTabContent(activeAdminTab);

  } catch (error) {
    console.error(error);
    showToast("Failed to write document transactions.", false);
  }
}

// ----------------------------------------------------
// 12. CRUD EDIT DRIVERS (populates modals with values)
// ----------------------------------------------------
async function editCrudDocument(colKey, id) {
  openCrudModal(colKey);
  
  // Set ID value to represent Editing state
  document.getElementById("crud-item-id").value = id;
  
  const modalTitle = document.getElementById("crud-modal-title");
  modalTitle.innerText = "Edit Database Record";

  try {
    if (colKey === "whyUs") {
      const match = currentWhyUs.find(w => w.$id === id);
      if (match) {
        document.getElementById("why-title").value = match.title;
        document.getElementById("why-desc").value = match.description;
        document.getElementById("why-icon").value = match.icon || "Shield";
        document.getElementById("why-order").value = match.order || 0;
      }
    } else if (colKey === "processSteps") {
      const match = currentProcessSteps.find(p => p.$id === id);
      if (match) {
        document.getElementById("proc-title").value = match.title;
        document.getElementById("proc-desc").value = match.description;
        document.getElementById("proc-icon").value = match.icon || "Activity";
        document.getElementById("proc-order").value = match.order || 0;
      }
    } else if (colKey === "services") {
      const match = currentServices.find(s => s.$id === id);
      if (match) {
        document.getElementById("serv-title").value = match.title || "";
        document.getElementById("serv-full-desc").value = match.fullDescription || "";
        document.getElementById("serv-order").value = match.order || 0;
        
        if (match.imageId) {
          const preview = document.getElementById("serv-image-preview");
          const label = document.getElementById("serv-image-lbl");
          if (preview) {
            preview.src = AppServices.getFileView(match.imageId);
            preview.style.display = "block";
          }
          if (label) label.style.display = "none";
        }
      }
    } else if (colKey === "cases") {
      const match = currentCases.find(c => c.$id === id);
      if (match) {
        document.getElementById("case-title").value = match.title || "";
        document.getElementById("case-order").value = match.order || 0;

        // Populate category dropdown
        const catEl = document.getElementById("case-category");
        if (catEl && match.category) catEl.value = match.category;

        // Set cover thumbnail
        const setThumb = (key, fid) => {
          if (!fid) return;
          const preview = document.getElementById(`${key}-preview`);
          const label = document.getElementById(`${key}-lbl`);
          if (preview) {
            preview.src = AppServices.getFileView(fid);
            preview.style.display = "block";
          }
          if (label) label.style.display = "none";
        };
        
        setThumb("case-main", match.mainImageId);
      }
    }
  } catch (error) {
    console.error("Edit load failed:", error);
    showToast("Failed to load records details.", false);
  }
}

// ----------------------------------------------------
// 13. CRUD DELETE DRIVERS
// ----------------------------------------------------
async function deleteCrudDocument(colKey, id) {
  const confirmResult = confirm("Are you absolutely sure you want to permanently delete this document record?");
  if (!confirmResult) return;

  try {
    showToast("Processing deletion...", true);
    
    if (colKey === "whyUs") await AppServices.deleteWhyUs(id);
    else if (colKey === "processSteps") await AppServices.deleteProcessStep(id);
    else if (colKey === "services") await AppServices.deleteService(id);
    else if (colKey === "cases") await AppServices.deleteCase(id);
    
    showToast("Record deleted successfully.", true);
    if (typeof PubCache !== 'undefined') PubCache.bust();
    loadTabContent(activeAdminTab);
  } catch (e) {
    console.error(e);
    showToast("Failed to delete database record.", false);
  }
}

// ----------------------------------------------------
// 14. Floating UI alert toasts notifications
// ----------------------------------------------------
function showToast(message, isSuccess = true) {
  const toast = document.getElementById("admin-toast-banner");
  const msgLbl = document.getElementById("toast-banner-msg");
  
  const successIcon = document.getElementById("toast-success-icon");
  const errorIcon = document.getElementById("toast-error-icon");
  
  if (!toast || !msgLbl) return;
  
  msgLbl.innerText = message;
  
  if (isSuccess) {
    toast.classList.add("admin-toast-success");
    toast.classList.remove("admin-toast-error");
    if (successIcon) successIcon.style.display = "block";
    if (errorIcon) errorIcon.style.display = "none";
  } else {
    toast.classList.add("admin-toast-error");
    toast.classList.remove("admin-toast-success");
    if (successIcon) successIcon.style.display = "none";
    if (errorIcon) errorIcon.style.display = "block";
  }
  
  // Slide in
  toast.classList.add("show");
  
  // Slide out after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// ----------------------------------------------------
// 15. Theme Engine Switcher (Light / Dark)
// ----------------------------------------------------
function initThemeEngine() {
  const root = document.documentElement;
  let savedTheme = localStorage.getItem("sharafdent_theme") || "dark";
  if (savedTheme === "night") savedTheme = "dark"; // Migrate legacy theme
  
  root.setAttribute("data-theme", savedTheme);
  updateThemeSwitcherUI(savedTheme);
  
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

// ============================================================
// PRICELIST PANEL — Admin Management Functions
// ============================================================

async function loadPricelistPanel() {
  // Fill the shareable link
  const linkField = document.getElementById("pl-link-field");
  if (linkField) {
    linkField.value = window.location.origin + window.location.pathname.replace("admin.html", "") + "pricelist.html";
  }

  // Fill current password from settings
  const settings = await AppServices.getSettings();
  const pwField = document.getElementById("pl-password-field");
  if (pwField && settings.pricelistPassword) {
    pwField.value = settings.pricelistPassword;
  }

  // Build the price table
  const tbody = document.getElementById("pricelist-services-tbody");
  if (!tbody) return;

  const services = await AppServices.getServices();
  const published = services.filter(s => s.isPublished !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  if (published.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">لا توجد خدمات منشورة</td></tr>`;
    return;
  }

  tbody.innerHTML = published.map(s => `
    <tr id="price-row-${s.$id}">
      <td>
        <strong style="font-size:14px;">${s.title}</strong>
      </td>
      <td>
        <input
          type="text"
          id="price-val-${s.$id}"
          class="form-control"
          style="padding:8px 12px;font-size:14px;font-weight:700;color:var(--primary);"
          value="${s.price || ""}"
          placeholder="e.g. 450"
        >
      </td>
      <td>
        <input
          type="text"
          id="price-unit-${s.$id}"
          class="form-control"
          style="padding:8px 12px;font-size:13px;"
          value="${s.priceUnit || "EGP"}"
          placeholder="EGP / unit"
        >
      </td>
      <td>
        <button
          class="btn btn-primary"
          style="padding:8px 14px;font-size:12px;"
          onclick="saveSingleServicePrice('${s.$id}')"
        >
          <i data-lucide="save" style="width:13px;height:13px;"></i> Save
        </button>
      </td>
    </tr>
  `).join("");

  lucide.createIcons();
}

async function saveSingleServicePrice(serviceId) {
  const price     = document.getElementById(`price-val-${serviceId}`)?.value.trim()  || "";
  const priceUnit = document.getElementById(`price-unit-${serviceId}`)?.value.trim() || "EGP";

  try {
    await AppServices.updateService(serviceId, { price, priceUnit });
    if (typeof PubCache !== "undefined") PubCache.bust();
    showToast("Price saved successfully", true);
  } catch (e) {
    console.error(e);
    if (e.message && e.message.includes("Unknown attribute")) {
      showToast("Setup required: add 'price' and 'priceUnit' attributes to services collection in Appwrite Console", false);
    } else {
      showToast("Failed to save price — check console", false);
    }
  }
}

// Save the pricelist access password to site settings
async function handlePricelistPasswordSave() {
  const pw = document.getElementById("pl-password-field")?.value.trim();
  if (!pw) {
    showToast("Enter a password first", false);
    return;
  }

  try {
    const settings = await AppServices.getSettings();
    await AppServices.updateSettings(settings.$id, { pricelistPassword: pw });
    if (typeof PubCache !== "undefined") PubCache.bust();
    showToast("Doctor access password saved successfully", true);
  } catch (e) {
    console.error(e);
    // Specific message for missing Appwrite attribute
    if (e.message && e.message.includes("Unknown attribute")) {
      showToast("Setup required: add 'pricelistPassword' attribute to site_settings in Appwrite Console first", false);
    } else {
      showToast("Failed to save password — check console for details", false);
    }
  }
}

// Copy the pricelist shareable link to clipboard
function copyPricelistLink() {
  const linkField = document.getElementById("pl-link-field");
  if (!linkField) return;

  navigator.clipboard.writeText(linkField.value).then(() => {
    showToast("Link copied — ready to share with doctors!", true);
  }).catch(() => {
    // Fallback for older browsers
    linkField.select();
    document.execCommand("copy");
    showToast("Link copied successfully!", true);
  });
}
