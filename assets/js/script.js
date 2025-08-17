// --- THEME TOGGLE ---
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeToggle.checked = (theme === 'dark');
  themeLabel.textContent = theme === 'dark' ? "Light Mode" : "Dark Mode";
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
} else {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(systemDark ? 'dark' : 'light');
}
themeToggle.addEventListener('change', () => {
  const newTheme = themeToggle.checked ? 'dark' : 'light';
  setTheme(newTheme);
});

// --- CART + PRODUCTS ---
let cart = [];
let products = [];

fetch('products.json')
  .then(res => res.json())
  .then(data => {
    products = data;
    renderProducts(products);
  });

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.cover}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.author}</p>
      <p class="price">₹${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to Cart</button>
      <button onclick="buyNow('${p.id}')">Buy Now</button>
    </div>
  `).join('');
}

// Add to Cart
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    cart.push(product);
    updateCartCount();
    showToast(`${product.title} added to cart!`);
  }
}

function updateCartCount() {
  document.getElementById("cartCount").textContent = cart.length;
}

function showCart() {
  const cartModal = document.getElementById("cartModal");
  const cartItems = document.getElementById("cartItems");
  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cartItems.innerHTML = cart.map(item => `<p>${item.title} — ₹${item.price}</p>`).join("");
  }
  cartModal.style.display = "block";
}

function closeCart() {
  document.getElementById("cartModal").style.display = "none";
}

// --- PAYMENT (Razorpay) ---
// Replace with your Razorpay TEST Key ID
const RAZORPAY_KEY = "rzp_test_xxxxxxxxxx";

// Direct "Buy Now"
function buyNow(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  var options = {
    "key": RAZORPAY_KEY,
    "amount": product.price * 100,
    "currency": "INR",
    "name": "Notes Store",
    "description": product.title,
    "handler": function (response) {
      alert("Payment successful for " + product.title + " ✅\nPayment ID: " + response.razorpay_payment_id);
    },
    "prefill": {
      "name": "Student",
      "email": "student@example.com",
      "contact": "9999999999"
    },
    "theme": { "color": "#3399cc" }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

// Cart Checkout
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  var options = {
    "key": RAZORPAY_KEY,
    "amount": total * 100,
    "currency": "INR",
    "name": "Notes Store",
    "description": "Cart Checkout",
    "handler": function (response) {
      alert("Payment successful for " + cart.length + " items ✅\nPayment ID: " + response.razorpay_payment_id);
      cart = [];
      updateCartCount();
      closeCart();
    },
    "prefill": {
      "name": "Student",
      "email": "student@example.com",
      "contact": "9999999999"
    },
    "theme": { "color": "#3399cc" }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

// --- TOAST ---
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}
