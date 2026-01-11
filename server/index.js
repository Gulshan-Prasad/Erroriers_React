import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

/* ✅ helper: clean json (remove ```json fences if model returns them) */
function cleanJson(raw) {
  if (!raw) return "";
  return raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

/* ---------------- AI INSIGHTS (WARD) ---------------- */
app.post("/api/insights", async (req, res) => {
  try {
    const { ward, zones } = req.body;

    if (!ward) return res.status(400).json({ error: "ward is required" });

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
    console.log("✅ OpenRouter /api/insights:", data?.choices?.[0]?.message?.content);

    const raw = cleanJson(data?.choices?.[0]?.message?.content || "");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { insights: [], raw };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("❌ /api/insights error:", err);
    return res.status(500).json({ error: "OpenRouter request failed" });
  }
});

/* ---------------- WEATHER ---------------- */
app.get("/api/weather", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "q is required (city or lat,lon)" });

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${
      process.env.WEATHERAPI_KEY
    }&q=${encodeURIComponent(q)}&days=3&aqi=yes&alerts=yes`;

    const response = await fetch(url);
    const data = await response.json();

    if (data?.error) {
      console.log("❌ WeatherAPI error:", data.error);
      return res.status(400).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ /api/weather error:", err);
    return res.status(500).json({ error: "WeatherAPI request failed" });
  }
});

/* ---------------- AI RAIN RISK ---------------- */
app.post("/api/rain-risk", async (req, res) => {
  try {
    const { weather } = req.body;
    if (!weather) return res.status(400).json({ error: "weather is required" });

    // ✅ compact payload for cheaper + cleaner AI
    const compact = {
      location: {
        name: weather?.location?.name,
        region: weather?.location?.region,
        country: weather?.location?.country,
        lat: weather?.location?.lat,
        lon: weather?.location?.lon,
      },
      current: {
        temp_c: weather?.current?.temp_c,
        precip_mm: weather?.current?.precip_mm,
        humidity: weather?.current?.humidity,
        wind_kph: weather?.current?.wind_kph,
        condition: weather?.current?.condition?.text,
      },
      forecast: (weather?.forecast?.forecastday || []).map((d) => ({
        date: d.date,
        condition: d.day?.condition?.text,
        chance_of_rain: Number(d.day?.daily_chance_of_rain || 0),
        totalprecip_mm: Number(d.day?.totalprecip_mm || 0),
        maxwind_kph: Number(d.day?.maxwind_kph || 0),
      })),
    };

    const prompt = `
You are a rain + flood risk analyzer.

Return ONLY JSON:

{
  "willRain": true/false,
  "risk": "SAFE" | "NORMAL" | "CRUCIAL" | "DANGEROUS",
  "summary": "1 short line",
  "reasons": ["...", "..."],
  "actions": ["...", "..."],
  "advice": "Write one general suggestion paragraph based on weather + rain risk (2–3 lines)."
}

Rules:
- If chance_of_rain >= 70 OR totalprecip_mm >= 20 => DANGEROUS
- If chance_of_rain 40-69 OR totalprecip_mm 5-19 => CRUCIAL
- Else NORMAL
- SAFE only if no rain expected and precip is 0.

Weather Data:
${JSON.stringify(compact, null, 2)}
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
          { role: "system", content: "Return ONLY valid JSON. No markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    console.log("✅ OpenRouter /api/rain-risk:", data?.choices?.[0]?.message?.content);

    const raw = cleanJson(data?.choices?.[0]?.message?.content || "");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        willRain: null,
        risk: "NORMAL",
        summary: "AI failed to return valid JSON",
        reasons: [],
        actions: [],
        raw,
      };
    }

    return res.json(parsed);
  } catch (err) {
    console.error("❌ /api/rain-risk error:", err);
    return res.status(500).json({ error: "Rain risk AI failed" });
  }
});

/* ✅ LISTEN LAST */
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
