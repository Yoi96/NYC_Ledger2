import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
// NOTE: don't import Vite at top-level — it's a devDependency and will break production installs on Vercel
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Allow large payloads for base64 image receipt scanning
app.use(express.json({ limit: "25mb" }));

// Helper for Gemini Content Generation with Fallback Keys and Models
const USER_PROVIDED_KEY = process.env.GEMINI_API_KEY || "";

const getCandidateApiKeys = (): string[] => {
  const keys: string[] = [];
  if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim()
  ) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
};

async function generateContentWithFallback(requestParams: { contents: any; config: any }) {
  const keys = getCandidateApiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is missing. Please configure GEMINI_API_KEY in Secrets.");
  }

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const apiKey of keys) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini API] Attempting call with key (...${apiKey.slice(-6)}) and model '${modelName}'...`);
        const res = await ai.models.generateContent({
          model: modelName,
          ...requestParams,
        });
        console.log(`[Gemini API] Success with model '${modelName}'`);
        return res;
      } catch (err: any) {
        lastError = err;
        const errStr = err?.message || String(err);
        console.warn(`[Gemini API] Failed with model '${modelName}': ${errStr}`);
      }
    }
  }

  throw lastError;
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to resolve base64 image data or URL string
async function resolveImageBase64(imageBase64: string, mimeType = "image/jpeg"): Promise<{ cleanBase64: string; detectedMime: string }> {
  if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
    try {
      const fetchRes = await fetch(imageBase64);
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch image: ${fetchRes.status} ${fetchRes.statusText}`);
      }
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = fetchRes.headers.get("content-type") || mimeType;
      return {
        cleanBase64: buffer.toString("base64"),
        detectedMime: contentType.split(";")[0],
      };
    } catch (err: any) {
      console.error("Failed to fetch image URL:", err);
      throw new Error(`Could not fetch image from URL: ${err.message}`);
    }
  }

  const cleanBase64 = imageBase64.includes(",")
    ? imageBase64.split(",")[1].trim()
    : imageBase64.trim();
  const detectedMime = imageBase64.match(/^data:([^;]+);base64,/)?.[1] || mimeType || "image/jpeg";

  return { cleanBase64, detectedMime };
}

// OCR / Receipt Analysis API using Gemini Multimodal Vision
app.post("/api/parse-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const { cleanBase64, detectedMime } = await resolveImageBase64(imageBase64, mimeType);

    console.log(`[Parse Receipt] Processing image (mime: ${detectedMime}, base64 length: ${cleanBase64.length})`);

    const prompt = `You are an expert NYC personal expense assistant.
Analyze this photo or receipt image carefully. Extract all receipt details into structured JSON.

CRITICAL AUTO-FILL & MAPPING RULES:
1. "merchant": Store, vendor, supermarket, or merchant name (e.g. "Target", "Trader Joe's", "The Halal Guys", "Sephora", "Uniqlo", "Zara", "CVS"). If no store name is printed, infer the store/vendor name or generate a descriptive merchant name.
2. "productName": Primary Product / Item Title (e.g. "Laundry Cleaning & Closet", "Target Household", "Lodge 12' Cast Iron Skillet", "AIRism Cotton T-Shirt", "Lipstick & Cosmetics", "Groceries & Snacks"). If the photo shows specific items, auto-identify the item. If no explicit item name is written, auto-generate a smart item title based on visible items, brand, or receipt lines.
3. "total": Total Amount paid in $ USD (numeric). Extract final amount paid or total line.
4. "category": Automatically classify into ONE of:
   - "Transit (MTA/OMNY)"
   - "Food & Dining"
   - "Groceries"
   - "Housing & Utilities"
   - "Shopping & Fashion" (Use for apparel, cosmetics, makeup, shoes, electronics, Target/Walgreens general merchandise)
   - "Culture & Fun"
   - "Services"
   - "Other"
5. "subCategory": Specific subcategory or tag (e.g. "Target", "Beauty & Cosmetics", "Clothing <$110 (Tax Exempt)", "Supermarket", "Bodega", "Pharmacy").
6. "date": Transaction date formatted strictly as YYYY-MM-DD. Look for printed date on receipt (header, footer, timestamp). Convert to YYYY-MM-DD.
7. "tax": Sales Tax ($ USD). Note: NYC sales tax is 8.875%. Clothing under $110 per item is tax exempt (tax = 0).
8. "tip": Tip amount ($ USD), 0 if not applicable.
9. "borough": NYC Borough if known or inferable from address/zipcode (e.g. "Queens" for Flushing 11354/Astoria, "Manhattan", "Brooklyn", "The Bronx", "Staten Island").
10. "neighborhood": NYC Neighborhood (e.g. "Flushing", "SoHo", "East Village", "Midtown", "Williamsburg", "Chelsea").
11. "items": Itemized purchased items list [{ name, price, qty }].`;

    const response = await generateContentWithFallback({
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: {
              type: Type.STRING,
              description: "Store, vendor, or restaurant name",
            },
            productName: {
              type: Type.STRING,
              description: "Main product name or item title recognized from the receipt or photo",
            },
            total: {
              type: Type.NUMBER,
              description: "Final total paid in USD",
            },
            tax: {
              type: Type.NUMBER,
              description: "Tax amount paid in USD, 0 if exempt or not found",
            },
            tip: {
              type: Type.NUMBER,
              description: "Tip amount paid in USD, 0 if not applicable",
            },
            date: {
              type: Type.STRING,
              description: "Date formatted as YYYY-MM-DD",
            },
            category: {
              type: Type.STRING,
              description: "Primary expense category",
            },
            subCategory: {
              type: Type.STRING,
              description: "Specific subcategory e.g. MTA Subway, Bodega, Trader Joe's, Broadway, Clothing <$110, etc.",
            },
            borough: {
              type: Type.STRING,
              description: "NYC Borough if known (Manhattan, Brooklyn, Queens, Bronx, Staten Island, or Unknown)",
            },
            neighborhood: {
              type: Type.STRING,
              description: "Specific NYC neighborhood or area if known or inferred",
            },
            items: {
              type: Type.ARRAY,
              description: "List of purchased items",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  qty: { type: Type.NUMBER },
                },
                required: ["name", "price"],
              },
            },
            nycTaxNote: {
              type: Type.STRING,
              description: "Note regarding tax accuracy or exemption (e.g., Clothing under $110 tax exempt verified).",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score between 0.0 and 1.0",
            },
          },
          required: ["merchant", "total", "category"],
        },
      },
    });

    let jsonText: string;
    try {
      jsonText = response.text || "{}";
    } catch (e) {
      console.error("Failed to extract text from Gemini response:", e);
      jsonText = "{}";
    }

    if (!jsonText || jsonText.trim() === "") {
      jsonText = "{}";
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON response:", jsonText);
      return res.status(400).json({
        success: false,
        error: "Gemini returned invalid JSON. Please try again.",
      });
    }

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error parsing receipt with Gemini:", err);
    const errStr = err?.message || String(err);
    return res.status(400).json({
      success: false,
      error: `Gemini AI Scan failed (${errStr.includes("API key not valid") ? "API key invalid or missing" : errStr}). Please configure GEMINI_API_KEY in platform Secrets or enter transaction manually.`,
    });
  }
});

// AI Product Photo & Price Recognition Endpoint
app.post("/api/identify-product", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const { cleanBase64, detectedMime } = await resolveImageBase64(imageBase64, mimeType);

    console.log(`[Identify Product] Processing image (mime: ${detectedMime}, base64 length: ${cleanBase64.length})`);

    const prompt = `You are an AI product identification and expense assistant.
Analyze this image of a product, item, merchandise, price tag, menu item, or packaging.

Extract:
1. productName: Concise brand and product name (e.g. "Trader Joe's Organic Whole Milk", "Nike Dunk Low Retro", "Starbucks Iced Caramel Macchiato", "AirPods Pro").
2. price: If a price tag, price tag sticker, shelf label, menu price, or receipt number is visible in the image, extract the numerical price in USD. If NO price tag or number is visible in the photo, [...]
3. category: Choose one of:
   - "Housing & Utilities" (For cookware, kitchenware, skillets, pots/pans, home appliances, furniture, and home supplies)
   - "Shopping & Fashion" (For clothing, footwear, accessories, beauty, tech gadgets)
   - "Food & Dining"
   - "Groceries"
   - "Culture & Fun"
   - "Services"
   - "Transit (MTA/OMNY)"
   - "Other"
4. subCategory: Specific subcategory (e.g., "Home & Kitchen", "Home Supplies", "Clothing <$110 (Tax Exempt)", "Groceries", "Coffee", "Tech & Gadgets").
5. description: A brief, helpful 1-sentence description or feature summary of the item.
6. confidence: Confidence score between 0.0 and 1.0.`;

    const response = await generateContentWithFallback({
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: {
              type: Type.STRING,
              description: "Brand and product title",
            },
            price: {
              type: Type.NUMBER,
              description: "Extracted price in USD, or 0 if not visible on image",
            },
            category: {
              type: Type.STRING,
              description: "Primary expense category",
            },
            subCategory: {
              type: Type.STRING,
              description: "Specific subcategory",
            },
            description: {
              type: Type.STRING,
              description: "Brief product summary or notes",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score",
            },
          },
          required: ["productName", "category"],
        },
      },
    });

    let jsonText: string;
    try {
      jsonText = response.text || "{}";
    } catch (e) {
      console.error("Failed to extract text from Gemini response:", e);
      jsonText = "{}";
    }

    if (!jsonText || jsonText.trim() === "") {
      jsonText = "{}";
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON response:", jsonText);
      return res.status(400).json({
        success: false,
        error: "Gemini returned invalid JSON. Please try again.",
      });
    }

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error identifying product with Gemini:", err);
    const errStr = err?.message || String(err);
    return res.status(400).json({
      success: false,
      error: `Gemini AI product recognition failed (${errStr.includes("API key not valid") ? "API key invalid or missing" : errStr}). Please configure GEMINI_API_KEY in platform Secrets or enter details manually.`,
    });
  }
});

async function startServer() {
  // Service worker & Manifest endpoint overrides for PWABuilder & browsers
  app.get("/sw.js", (req, res) => {
    const swPath = path.join(process.cwd(), "sw.js");
    if (fs.existsSync(swPath)) {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Service-Worker-Allowed", "/");
      return res.sendFile(swPath);
    }
    return res.status(404).send("Service Worker not found");
  });

  app.get("/manifest.json", (req, res) => {
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.setHeader("Content-Type", "application/manifest+json");
      return res.sendFile(manifestPath);
    }
    return res.status(404).send("Manifest not found");
  });

  // Vite middleware in dev, static build in production
  if (process.env.NODE_ENV !== "production") {
    // Lazy-import Vite so production installs without devDependencies don't crash
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      } as any);
      app.use((vite as any).middlewares);
    } catch (e) {
      console.warn("Vite could not be loaded in development mode:", e);
    }
  } else {
    // prefer common build output directories (dist/build/public)
    const candidates = ["dist", "build", "public"];
    let distDir = candidates.find((d) => fs.existsSync(path.join(process.cwd(), d)));
    if (!distDir) {
      console.warn(`No static output directory found (${candidates.join(', ')}). Falling back to 'dist'. Make sure you run the build step and output to one of these directories.`);
      distDir = "dist";
    }

    const distPath = path.join(process.cwd(), distDir);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`NYC Ledger Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
