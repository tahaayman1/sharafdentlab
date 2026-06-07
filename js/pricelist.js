// ============================================================
// SHARAF DENT LAB — Pricelist Page Engine (pricelist.html)
// ============================================================

const PL_SESSION_KEY = "pl_auth_v1";

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();

  // Check if already authenticated in this session
  const savedPw = sessionStorage.getItem(PL_SESSION_KEY);
  if (savedPw) {
    // Re-verify against Appwrite (in case password changed)
    await verifyAndEnter(savedPw, true);
  }
});

// ── Toggle password visibility ─────────────────────────────
function togglePLPassword() {
  const input = document.getElementById("pl-password-input");
  const icon  = document.getElementById("pl-eye-icon");
  if (input.type === "password") {
    input.type = "text";
    icon.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    icon.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
}

// ── Handle form submit ─────────────────────────────────────
async function handlePricelistAuth(event) {
  event.preventDefault();
  const btn      = document.getElementById("pl-auth-submit-btn");
  const errorBox = document.getElementById("pl-auth-error");
  const errorMsg = document.getElementById("pl-auth-error-msg");
  const pw       = document.getElementById("pl-password-input").value.trim();

  errorBox.style.display = "none";
  btn.disabled   = true;
  btn.innerHTML  = `<i data-lucide="loader-2" class="spin" style="width:15px;height:15px;"></i> Verifying...`;
  lucide.createIcons();

  const ok = await verifyAndEnter(pw);
  if (!ok) {
    errorMsg.textContent   = "Incorrect password. Please try again.";
    errorBox.style.display = "flex";
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="log-in" style="width:15px;height:15px;"></i> Access Price List`;
    lucide.createIcons();
    // Shake input
    const input = document.getElementById("pl-password-input");
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 600);
  }
}

// ── Core auth + page load ──────────────────────────────────
async function verifyAndEnter(password, silent = false) {
  try {
    const settings = await AppServices.getSettings();
    const correct  = settings.pricelistPassword || "";

    if (!correct) {
      if (!silent) showPLError("Access password not configured yet. Contact the lab administrator.");
      return false;
    }

    if (password !== correct) return false;

    // ✅ Correct — save to session and show page
    sessionStorage.setItem(PL_SESSION_KEY, password);
    await loadPricelistPage(settings);
    return true;

  } catch (e) {
    console.error("PL auth error:", e);
    if (!silent) showPLError("Connection error. Please try again.");
    return false;
  }
}

function showPLError(msg) {
  const errorBox = document.getElementById("pl-auth-error");
  const errorMsg = document.getElementById("pl-auth-error-msg");
  if (errorBox && errorMsg) {
    errorMsg.textContent   = msg;
    errorBox.style.display = "flex";
  }
}

// ── Load and render the price list ────────────────────────
async function loadPricelistPage(settings) {
  // Switch screens
  document.getElementById("pl-auth-screen").style.display = "none";
  document.getElementById("pl-main-screen").style.display  = "block";

  // Fill footer contacts
  const contacts = document.getElementById("pl-footer-contacts");
  if (contacts && settings) {
    contacts.innerHTML = `
      ${settings.whatsapp ? `<a href="https://wa.me/${settings.whatsapp.replace(/\D/g,'')}" target="_blank" class="pl-contact-link"><i data-lucide="message-circle" style="width:20px;height:20px;"></i></a>` : ""}
      ${settings.email ? `<a href="mailto:${settings.email}" class="pl-contact-link"><i data-lucide="mail" style="width:20px;height:20px;"></i></a>` : ""}
    `;
  }

  try {
    const services = await AppServices.getServices();
    const active   = services.filter(s => s.isPublished !== false).sort((a,b) => (a.order||0)-(b.order||0));

    const grid    = document.getElementById("pl-services-grid");
    const loading = document.getElementById("pl-loading-state");
    const empty   = document.getElementById("pl-empty-state");

    loading.style.display = "none";

    if (active.length === 0) {
      empty.style.display = "block";
      lucide.createIcons();
      return;
    }

    grid.style.display = "grid";
    grid.innerHTML = active.map(s => {
      const imgSrc   = s.imageId ? AppServices.getFileThumb(s.imageId, 600, 80) : "";
      const price    = s.price    || "";
      const unit     = s.priceUnit || "جنيه";
      const features = (s.fullDescription || "").split("\n").map(l => l.trim()).filter(Boolean);

      return `
        <div class="pl-service-card">
          ${imgSrc ? `
          <div class="pl-card-img-wrap">
            <img src="${imgSrc}" alt="${s.title}" class="pl-card-img" loading="lazy">
            ${s.isFeatured ? '<span class="pl-featured-badge"><i data-lucide="star" style="width:10px;height:10px;"></i> Featured</span>' : ""}
          </div>` : `
          <div class="pl-card-img-wrap pl-card-no-img">
            <i data-lucide="image-off" style="width:40px;height:40px;color:var(--text-muted);"></i>
          </div>`}

          <div class="pl-card-body">
            <h3 class="pl-card-title">${s.title}</h3>

            ${features.length > 0 ? `
            <ul class="pl-card-features">
              ${features.slice(0,4).map(f => `<li><i data-lucide="check" style="width:12px;height:12px;color:var(--primary);flex-shrink:0;"></i>${f}</li>`).join("")}
            </ul>` : ""}

            <div class="pl-card-footer">
              <div class="pl-price-block">
                ${price ? `
                  <span class="pl-price-label">Price</span>
                  <div class="pl-price-value">
                    <span class="pl-price-number">${price}</span>
                    <span class="pl-price-unit">${unit}</span>
                  </div>
                ` : `
                  <span class="pl-price-tbd">Price on request</span>
                `}
              </div>
              ${settings && settings.whatsapp ? `
              <a href="https://wa.me/${settings.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Hello, I would like to enquire about: ' + s.title)}"
                 target="_blank" class="pl-wa-btn">
                <i data-lucide="message-circle" style="width:13px;height:13px;"></i>
                Book or Enquire
              </a>` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();

  } catch (e) {
    console.error("Failed to load services:", e);
    document.getElementById("pl-loading-state").style.display = "none";
    document.getElementById("pl-empty-state").style.display   = "block";
    lucide.createIcons();
  }
}

// ── Logout ─────────────────────────────────────────────────
function plLogout() {
  sessionStorage.removeItem(PL_SESSION_KEY);
  document.getElementById("pl-main-screen").style.display  = "none";
  document.getElementById("pl-auth-screen").style.display  = "flex";
  document.getElementById("pl-password-input").value = "";
  document.getElementById("pl-auth-error").style.display   = "none";
  lucide.createIcons();
}
