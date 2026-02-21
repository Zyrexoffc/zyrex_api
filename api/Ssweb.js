const { chromium } = require("playwright");
const { Buffer } = require("buffer");

/* ======================
   CREATE IMAGE RESPONSE
====================== */
const createImageResponse = (buffer, filename = null) => {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return new Response(buffer, { headers });
};

/* ======================
   SCREENSHOT FUNCTION
====================== */
async function takeScreenshot(url, theme, device) {
  let browser;

  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const deviceSettings = {
      desktop: { width: 1920, height: 1080 },
      mobile: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
    };

    await page.setViewportSize(deviceSettings[device]);

    await page.goto(formattedUrl, { waitUntil: "domcontentloaded" });

    if (theme === "dark") {
      await page.evaluate(() => {
        document.body.style.backgroundColor = "#1a1a1a";
        document.body.style.color = "#ffffff";
      });
    } else {
      await page.evaluate(() => {
        document.body.style.backgroundColor = "#ffffff";
        document.body.style.color = "#000000";
      });
    }

    await page.waitForTimeout(1000);

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    return screenshotBuffer;
  } catch (e) {
    throw new Error("Failed to take screenshot: " + e.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/* ======================
   ENDPOINT DEFINITION
====================== */
module.exports = [
  {
    name: "Screenshot Web",
    desc: "Capture website screenshot",
    category: "Tools",
    path: "/tools/ssweb?apikey=",

    async run(req, res) {
      const { apikey, url, theme = "light", device = "desktop" } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Parameter url required" });
      }

      if (!["light", "dark"].includes(theme)) {
        return res.json({ status: false, error: "Theme must be light or dark" });
      }

      if (!["desktop", "mobile", "tablet"].includes(device)) {
        return res.json({
          status: false,
          error: "Device must be desktop, mobile, or tablet",
        });
      }

      try {
        const image = await takeScreenshot(url, theme, device);
        return createImageResponse(image);
      } catch (e) {
        return res.status(500).json({
          status: false,
          error: e.message,
        });
      }
    },
  },
];
