import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());

  // API Routes
  app.post("/api/leads/add-single", async (req, res) => {
    let { rawData } = req.body;
    if (!rawData) return res.status(400).json({ error: "Missing rawData" });

    try {
      // 1. Clean Input
      rawData = rawData.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

      // 2. Detect Format & Split
      let parts: string[] = [];
      let formatDetected = "TAB";
      if (rawData.includes('\t')) {
        parts = rawData.split('\t');
      } else if (rawData.includes('|')) {
        parts = rawData.split('|');
        formatDetected = "PIPE";
      } else {
        parts = rawData.split(/\s{2,}/);
        formatDetected = "SPACE";
      }

      // 3. Normalize
      parts = parts.map(p => p.trim()).filter(p => p.length > 0);

      // 6. Handle Broken Rows
      if (parts.length < 5) {
        return res.status(400).json({ error: "Invalid format: Insufficient data fields" });
      }

      // 4. Safe Mapping
      const date = parts[0] || new Date().toISOString();
      let phone = parts[1] || "";
      const name = parts[2] || "";
      const product = parts[3] || "";
      const city = parts[4] || "";
      let companyName = parts[5] || "Individual";
      let email = parts[6] || "";

      // Cleanup: If companyName contains "@", swap with email field
      if (companyName.includes('@')) {
        if (!email) {
          email = companyName;
          companyName = "Individual";
        } else if (!email.includes('@')) {
          const temp = companyName;
          companyName = email;
          email = temp;
        }
      }

      // 5. Phone Fix
      phone = phone.replace(/\D/g, "").slice(-10);
      if (phone.length !== 10) {
        return res.status(400).json({ error: "Invalid phone number: Must be 10 digits" });
      }

      const lead = {
        createdAt: date,
        phone,
        name,
        product,
        city,
        companyName,
        email,
        status: 'New',
        source: 'IndiaMART',
        note: `Imported from IndiaMART on ${new Date().toLocaleDateString()}`
      };

      res.json({ 
        message: `Detected ${formatDetected} format, parsed successfully`, 
        lead,
        format: formatDetected
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to parse lead" });
    }
  });

  app.post("/api/leads/import-bulk", async (req, res) => {
    const { rawData } = req.body;
    if (!rawData) return res.status(400).json({ error: "Missing rawData" });

    try {
      const lines = rawData.split('\n').filter((line: string) => line.trim());
      const parsed = lines.map((line: string) => {
        // 1. Clean Input
        const cleanLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

        // 2. Detect Format & Split
        let parts: string[] = [];
        if (cleanLine.includes('\t')) {
          parts = cleanLine.split('\t');
        } else if (cleanLine.includes('|')) {
          parts = cleanLine.split('|');
        } else {
          parts = cleanLine.split(/\s{2,}/);
        }

        // 3. Normalize
        parts = parts.map(p => p.trim()).filter(p => p.length > 0);

        // 6. Handle Broken Rows
        if (parts.length < 5) {
          return { isValid: false, error: "Insufficient fields" };
        }

        // 4. Safe Mapping
        const date = parts[0] || new Date().toISOString();
        let phone = parts[1] || "";
        const name = parts[2] || "";
        const product = parts[3] || "";
        const city = parts[4] || "";
        let companyName = parts[5] || "Individual";
        let email = parts[6] || "";

        // Cleanup: If companyName contains "@", swap with email field
        if (companyName.includes('@')) {
          if (!email) {
            email = companyName;
            companyName = "Individual";
          } else if (!email.includes('@')) {
            const temp = companyName;
            companyName = email;
            email = temp;
          }
        }

        // 5. Phone Fix
        phone = phone.replace(/\D/g, "").slice(-10);
        const isValidPhone = phone.length === 10;
        
        return {
          createdAt: date,
          phone,
          name,
          product,
          city,
          companyName,
          email,
          status: 'New',
          source: 'IndiaMART',
          note: `Imported from IndiaMART on ${new Date().toLocaleDateString()}`,
          isValid: isValidPhone,
          error: !isValidPhone ? "Invalid Phone" : null
        };
      });

      res.json({ 
        message: "Data parsed successfully", 
        leads: parsed,
        count: parsed.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to parse data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        allowedHosts: [".replit.dev", "localhost"],
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
