const express = require("express");
const puppeteer = require("puppeteer");

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

  const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu"
  ]
});
  const results = [];

  for (const url of urls) {
    try {
      const page = await browser.newPage();
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      const data = await page.evaluate(() => {
        const text = document.body.innerText;

        const priceMatch = text.match(/£\s?[\d.]+/);
        const stockMatch = text.match(/UK Stock\s*[:：]?\s*(\d+)/i);
        const holdMatch = text.match(/HOLD\s*[:：]?\s*(YES|NO)/i);

        return {
          price: priceMatch ? priceMatch[0].replace("£", "").trim() : "",
          stock: stockMatch ? stockMatch[1] : "",
          hold: holdMatch ? holdMatch[1] : ""
        };
      });

      let stock = Number(data.stock || 0);
      if ((data.hold || "").toUpperCase() === "YES") stock = 0;

      results.push({
        url,
        price: data.price,
        stock,
        hold: data.hold,
        status: "OK"
      });

      await page.close();
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

  await browser.close();

  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
