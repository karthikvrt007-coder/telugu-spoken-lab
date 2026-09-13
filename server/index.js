const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "..", "data");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

app.get("/api/catalog", (_req, res) => {
  res.json({
    language: "telugu-spoken-roman",
    support: "kannada",
    script: "roman-only",
    categories: [
      { id: "verbs", label: "Verbs", subs: ["present", "past", "future", "completed"] },
      { id: "connectors", label: "Connectors", subs: ["small"] },
      { id: "special", label: "Special words", subs: ["particles"] },
      { id: "addressing", label: "Addressing", subs: ["respect", "casual", "kin"] },
      { id: "sentences", label: "Sentences", subs: ["street", "home", "phone", "heat"] }
    ],
    note: "Backend holds conversation pieces only, not a full lexicon."
  });
});

app.get("/api/category/:id", (req, res) => {
  const map = {
    verbs: "verbs.json",
    connectors: "connectors.json",
    special: "special-words.json",
    addressing: "addressing.json",
    sentences: "sentences.json"
  };
  const file = map[req.params.id];
  if (!file) return res.status(404).json({ error: "unknown category" });
  const data = readJson(file);
  const sub = req.query.sub;
  if (sub) {
    return res.json({
      ...data,
      items: data.items.filter((i) => i.sub === sub)
    });
  }
  res.json(data);
});

app.get("/api/daily", (_req, res) => {
  res.json(readJson("daily-tasks.json"));
});

app.get("/api/rewards", (_req, res) => {
  res.json(readJson("rewards.json"));
});

app.get("/api/practice", (req, res) => {
  const pack = req.query.pack || "street";
  const sentences = readJson("sentences.json");
  const items = sentences.items.filter((i) => i.sub === pack);
  res.json({ pack, items });
});

app.listen(PORT, () => {
  console.log(`Telugu Spoken Lab on http://localhost:${PORT}`);
});
