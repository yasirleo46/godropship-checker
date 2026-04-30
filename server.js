const express = require("express");
const fetch = require("node-fetch"); // add this dep

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoDropship checker is running ✅");
});

app.post("/check-godropship", async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "urls array required" });
  }

  const results = [];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept-Language": "en-GB,en;q=0.9",
        },
        timeout: 30000,
      });

      const html = await r.text();

      // simple text search (works for GoDropship pages)
      // Extract price using ID
const priceMatch = html.match(/id="change_child_price"[^>]*>\s*£([\d.]+)/i);

// Extract stock using ID
const stockMatch = html.match(/id="change_child_inventory"[^>]*>\s*(\d+)/i);

// Extract HOLD
const holdMatch = html.match(/HOLD\s*[:：]?\s*(YES|NO)/i);

let price = priceMatch ? priceMatch[1] : "";
let stock = stockMatch ? Number(stockMatch[1]) : 0;
let hold = holdMatch ? holdMatch[1] : "";

if ((hold || "").toUpperCase() === "YES") stock = 0;

      results.push({
        url,
        price,
        stock,
        hold,
        status: "OK",
      });
    } catch (err) {
      results.push({
        url,
        price: "",
        stock: "",
        hold: "",
        status: "ERROR",
        message: err.message,
      });
    }
  }

  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
