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

// --- PRODUCTS ---
const grid = document.getElementById("productGrid");
const loader = document.getElementById("loader");

// 🔑 Your Apps Script endpoint
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxn4q4sBUldaHUlzR6jZKSTZjREzt4HdG38eW7T5EP28YfluKOm2HfdsHDEhObb13e4/exec";

// Load links.json (list of Razorpay short links)
fetch("../data/links.json")
  .then(res => res.json())
  .then(async links => {
    console.log("Fetched links:", links);

    // Render incrementally
    for (const link of links) {
      fetchFromBackend(link).then(product => {
        if (product) {
          renderProduct(product);
        }
      });
    }

    // Hide loader after starting fetch
    loader.style.display = "none";
    grid.style.display = "grid";
  })
  .catch(err => {
    console.error("Error loading links.json:", err);
    showError("❌ Failed to load products.");
  });

// --- Fetch product from Apps Script backend ---
async function fetchFromBackend(url) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?link=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!data) {
      console.warn("Empty backend response for", url);
      return null;
    }

    return {
      id: url,
      link: url,
      title: data.title?.trim().replace(/^Pay for\s*/i, "") || "Untitled",
      description: data.description?.trim() || "",
      price: data.amount ? (data.amount / 100).toFixed(2) : null,
      cover: data.image || ""
    };
  } catch (err) {
    console.error("Backend fetch error:", url, err);
    return null;
  }
}

// --- Render a single product ---
function renderProduct(p) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    ${p.cover ? `<img src="${p.cover}" alt="${p.title}">` : ""}
    <h3>${p.title}</h3>
    <p class="desc">${p.description}</p>
    ${p.price ? `<p class="price">₹${p.price}</p>` : `<p class="price">Price not available</p>`}
    <a href="${p.link}" target="_blank">
      <button>Buy Now</button>
    </a>
  `;

  grid.appendChild(card);
}

// --- Error message ---
function showError(msg) {
  loader.innerHTML = `<p style="color:red;">${msg}</p>`;
}
