import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- AI INSIGHTS ---------------- */
app.post("/api/insights", async (req, res) => {
    try {
        const { ward, zones } = req.body;

        if (!ward) {
            return res.status(400).json({ error: "ward is required" });
        }

        const prompt = `
You are an expert urban flood risk analyst.

Generate 4 to 6 actionable insights for flood/waterlogging risk mitigation.
Return ONLY JSON in this format:

{
  "insights": [
    { "title": "...", "subtitle": "...", "severity": "LOW|MEDIUM|HIGH|CRITICAL" }
  ]
}

Ward Data:
${JSON.stringify(ward, null, 2)}

Nearby flood zones (if any):
${JSON.stringify(zones || [], null, 2)}
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Flood Hub Dashboard",
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: "Return ONLY valid JSON. No markdown. No extra text." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.4,
            }),
        });

        const data = await response.json();
        console.log("OpenRouter response:", data);

        const raw = data?.choices?.[0]?.message?.content || "";

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = { insights: [], raw };
        }

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "OpenRouter request failed" });
    }
});

/* ---------------- WEATHER ---------------- */
app.get("/api/weather", async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: "q is required (city or lat,lon)" });
        }

        const url = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_KEY}&q=${encodeURIComponent(
            q
        )}&days=3&aqi=yes&alerts=yes`;


        const response = await fetch(url);
        const data = await response.json();

        if (data?.error) {
            return res.status(400).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "WeatherAPI request failed" });
    }
});

/* ✅ LISTEN MUST BE LAST */
app.listen(3001, () => console.log("Server running at http://localhost:3001"));
