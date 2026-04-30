const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GoDropship checker is running ✅");
});

function extractBetween(html, idName) {
  const regex = new RegExp(`id=["']${idName}["'][^>]*>([\\s\\S]*?)<\\/span>`, "i");
  const match = html.match(regex);
  if (!match) return "";
  return match[1].replace(/<[^>]*>/g, "").replace(/&pound;/g, "£").trim();
}

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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept-Language": "en-GB,en;q=0.9"
        }
      });

      const html = await r.text();

      const rawPrice = extractBetween(html, "change_child_price");
      const rawStock = extractBetween(html, "change_child_inventory");

      let price = rawPrice.replace("£", "").replace(",", "").trim();
      let stock = rawStock ? Number(rawStock.replace(/,/g, "").trim()) : 0;

      const holdMatch = html.match(/HOLD\s*[:：]?\s*(YES|NO)/i);
      let hold = holdMatch ? holdMatch[1] : "";

      if ((hold || "").toUpperCase() === "YES") stock = 0;

      results.push({
        url,
        price,
        stock,
        hold,
        status: "OK",
        debugRawPrice: rawPrice,
        debugRawStock: rawStock
      });

    } catch (err) {
      results.push({
        url,
        price: "",
        stock: "",
        hold: "",
        status: "ERROR",
        message: err.message
      });
    }
  }

  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
