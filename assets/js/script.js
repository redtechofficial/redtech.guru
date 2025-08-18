
// --- THEME (auto-detect + remember) ---
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
} else {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(systemDark ? 'dark' : 'light');
}

// --- PRODUCTS (via Razorpay Links) ---
let products = [];

// Loader + Grid references
const grid = document.getElementById("productGrid");
const loader = document.getElementById("loader");

// Load links.json
fetch("../data/links.json")
  .then(res => res.json())
  .then(async links => {
    console.log("Fetched links:", links);

    // Scrape each link
    const scraped = await Promise.all(links.map(link => scrapeRazorpay(link)));

    // Filter out failures
    products = scraped.filter(p => p !== null);

    console.log("Scraped products:", products);
    renderProducts(products);
  })
  .catch(err => {
    console.error("Error loading links.json:", err);
    showError("❌ Failed to load products.");
  });

async function scrapeRazorpay(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    console.log("Fetching:", proxyUrl);

    const res = await fetch(proxyUrl);
    const data = await res.json();

    if (!data || !data.contents) {
      console.warn("Empty response for", url);
      return null;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, "text/html");

    const title = doc.querySelector('meta[property="og:title"]')?.content 
                  || doc.title 
                  || "Untitled";
    const description = doc.querySelector('meta[property="og:description"]')?.content 
                        || "";
    const image = doc.querySelector('meta[property="og:image"]')?.content 
                  || "";

    // --- Improved price fetch ---
    let price = null;

    // 1) Check inputs with ₹
    const priceInput = Array.from(doc.querySelectorAll("input")).find(el => el.value.includes("₹"));
    if (priceInput) {
      price = priceInput.value.replace(/[^\d]/g, "");
    }

    // 2) If not found, scan body text for ₹ + numbers
    if (!price) {
      const match = doc.body.innerText.match(/₹\s?(\d+(\.\d{1,2})?)/);
      if (match) price = match[1];
    }

    return {
      id: url, // use link as ID
      link: url,
      title: title.trim(),
      description: description.trim(),
      price: price ? parseFloat(price) : null,
      cover: image
    };
  } catch (err) {
    console.error("Scrape error:", url, err);
    return null;
  }
}

function renderProducts(products) {
  // ✅ hide loader, show grid
  loader.style.display = "none";
  grid.style.display = "grid";

  if (!products.length) {
    grid.innerHTML = "<p>⚠️ No products could be loaded.</p>";
    return;
  }

  grid.innerHTML = products.map(p => {
    // strip "Pay for" from title
    const cleanTitle = p.title.replace(/^Pay for\s*/i, "");

    // full description (no truncation)
    const fullDesc = p.description;

    return `
      <div class="product-card">
        ${p.cover ? `<img src="${p.cover}" alt="${cleanTitle}">` : ""}
        <h3>${cleanTitle}</h3>
        <p class="desc">${fullDesc}</p>
        ${p.price ? `<p class="price">₹${p.price}</p>` : ""}
        <a href="${p.link}" target="_blank">
          <button>Buy Now</button>
        </a>
      </div>
    `;
  }).join('');
}

// --- Error message ---
function showError(msg) {
  loader.innerHTML = `<p style="color:red;">${msg}</p>`;
}

// --- TOAST ---
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

