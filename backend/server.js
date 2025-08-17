const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const fs = require("fs");
const products = require("../data/products.json");

const app = express();
app.use(express.json());

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get product list (for frontend fetch)
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Create Razorpay order
app.post("/api/create-order", async (req, res) => {
  const { productId } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const options = {
    amount: product.price * 100, // in paise
    currency: "INR",
    receipt: `receipt_${product.id}_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, product });
  } catch (err) {
    res.status(500).json({ error: "Error creating order" });
  }
});

// Verify payment (webhook)
app.post("/api/payment-success", (req, res) => {
  const { order_id, payment_id, signature, productId } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(order_id + "|" + payment_id)
    .digest("hex");

  if (generated_signature !== signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // ✅ Payment verified
  const product = products.find(p => p.id === productId);
  // Here you would store purchase in DB (userId, productId, timestamp, etc.)

  // Generate signed link (for now: just direct link, but should use signed URLs if cloud storage)
  const downloadLink = `/secure-download/${product.file}`;

  res.json({ success: true, downloadLink });
});

// Serve downloads (restrict access in real DB-based system)
app.get("/secure-download/:file", (req, res) => {
  const file = req.params.file;
  const filePath = `${__dirname}/../assets/files/${file}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.download(filePath);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
