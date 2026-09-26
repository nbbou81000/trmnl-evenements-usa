// fetch-events.js
// Zero-install : utilise le fetch natif de Node 18+, aucune dépendance npm.
// Usage (dans le workflow GitHub Actions) : TICKETMASTER_API_KEY=xxx node scripts/fetch-events.js

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.TICKETMASTER_API_KEY;
if (!API_KEY) {
  console.error("Erreur : la variable d'environnement TICKETMASTER_API_KEY est manquante.");
  process.exit(1);
}

const RADIUS_MILES = 25;
const WINDOW_DAYS = 60;
const MAX_EVENTS_PER_CITY = 20;
const DELAY_MS = 250; // reste sous les 5 requêtes/seconde imposées par Ticketmaster

const DAY_LABELS_FR = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

const TYPE_MAP = {
  "Music": { key: "music", label: "Musique" },
  "Sports": { key: "sports", label: "Sport" },
  "Arts & Theatre": { key: "arts", label: "Arts & théâtre" },
  "Film": { key: "film", label: "Cinéma" },
};

function typeInfo(segmentName) {
  return TYPE_MAP[segmentName] || { key: "misc", label: "Autre" };
}

function dayLabelFor(localDate) {
  // localDate au format YYYY-MM-DD (déjà en heure locale du lieu, pas de conversion TZ)
  const [y, m, d] = localDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_LABELS_FR[weekday];
}

function priceLabel(priceRanges) {
  if (!priceRanges || priceRanges.length === 0) return "Tarif non communiqué";
  const pr = priceRanges[0];
  const min = Math.round(pr.min);
  const max = Math.round(pr.max);
  if (min === max) return `${min} $`;
  return `${min}–${max} $`;
}

function venueLine(event) {
  const venue = event._embedded && event._embedded.venues && event._embedded.venues[0];
  if (!venue) return "";
  const city = venue.city ? venue.city.name : "";
  return city ? `${venue.name} • ${city}` : venue.name;
}

function mapEvent(event) {
  const segment =
    event.classifications &&
    event.classifications[0] &&
    event.classifications[0].segment &&
    event.classifications[0].segment.name;
  const { key, label } = typeInfo(segment);
  const localDate = event.dates.start.localDate;

  return {
    day_label: dayLabelFor(localDate),
    day_number: String(parseInt(localDate.split("-")[2], 10)),
    date_iso: localDate,
    title: event.name,
    venue_line: venueLine(event),
    price_label: priceLabel(event.priceRanges),
    type_key: key,
    type_label: label,
  };
}

async function fetchCityEvents(city) {
  const now = new Date();
  const end = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const startDateTime = now.toISOString().split(".")[0] + "Z";
  const endDateTime = end.toISOString().split(".")[0] + "Z";

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("latlong", `${city.lat},${city.lon}`);
  url.searchParams.set("radius", String(RADIUS_MILES));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", String(MAX_EVENTS_PER_CITY));

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`  -> HTTP ${res.status} pour ${city.label}`);
    return [];
  }
  const data = await res.json();
  const events = (data._embedded && data._embedded.events) || [];
  return events.map(mapEvent);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const citiesPath = path.join(__dirname, "..", "cities.json");
  const cities = JSON.parse(fs.readFileSync(citiesPath, "utf-8"));

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Récupération des événements pour ${cities.length} villes...`);

  for (const city of cities) {
    try {
      const events = await fetchCityEvents(city);
      const payload = {
        city_label: city.label,
        updated_at: new Date().toISOString(),
        events,
      };
      const outPath = path.join(outDir, `${city.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(`  -> ${city.label} : ${events.length} événement(s)`);
    } catch (err) {
      console.error(`  -> Échec pour ${city.label} :`, err.message);
    }
    await sleep(DELAY_MS);
  }

  console.log("Terminé.");
}

main();
