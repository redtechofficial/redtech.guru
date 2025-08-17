// Load cart
const cart = JSON.parse(localStorage.getItem("cart")) || [];
const cartItemsDiv = document.getElementById("cartItems");
const totalAmount = cart.reduce((sum, p) => sum + p.price, 0);

cartItemsDiv.innerHTML = cart.map(p => `<p>${p.title} - ₹${p.price}</p>`).join("");
document.getElementById("totalAmount").textContent = totalAmount;

// Checkout Form
document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;

  // 1️⃣ Create order
  const res = await fetch("http://localhost:5000/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: cart[0].id, // for now single product
      amount: totalAmount,
      email
    })
  });
  const data = await res.json();

  // 2️⃣ Razorpay Checkout
  const options = {
    key: data.key,
    amount: totalAmount * 100,
    currency: "INR",
    name: "Notes Store",
    description: cart[0].title,
    order_id: data.orderId,
    handler: async function (response) {
      // 3️⃣ Verify Payment
      const verifyRes = await fetch("http://localhost:5000/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: data.orderId,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          product_id: cart[0].id,
          email
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        window.location.href = `success.html?link=${encodeURIComponent(verifyData.download_url)}`;
      } else {
        alert("Payment verification failed");
      }
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
});
