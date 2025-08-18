
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

// Load links.json
fetch("../data/links.json")
  .then(res => res.json())
  .then(async links => {
    console.log("Fetched links:", links);

    // Render incrementally
    for (const link of links) {
      scrapeRazorpay(link).then(product => {
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

    // 1) Input fields with ₹
    const priceInput = Array.from(doc.querySelectorAll("input")).find(el => el.value.includes("₹"));
    if (priceInput) {
      price = priceInput.value.replace(/[^\d.]/g, "");
    }

    // 2) If not found, scan text
    if (!price) {
      const match = doc.body.innerText.match(/₹\s?(\d+(\.\d{1,2})?)/);
      if (match) price = match[1];
    }

    return {
      id: url,
      link: url,
      title: title.trim().replace(/^Pay for\s*/i, ""),
      description: description.trim(),
      price: price ? parseFloat(price).toFixed(2) : null,
      cover: image
    };
  } catch (err) {
    console.error("Scrape error:", url, err);
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
