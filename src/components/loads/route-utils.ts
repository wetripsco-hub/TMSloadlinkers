// Built-in US city and state centroid dictionary for fast, client-side route geocoding
export const US_COORDINATE_MAP: Record<string, [number, number]> = {
  // Cities
  "seattle, wa": [47.6062, -122.3321],
  "oakland, ca": [37.8044, -122.2712],
  "chicago, il": [41.8781, -87.6298],
  "atlanta, ga": [33.749, -84.388],
  "dallas, tx": [32.7767, -96.797],
  "phoenix, az": [33.4484, -112.074],
  "los angeles, ca": [34.0522, -118.2437],
  "denver, co": [39.7392, -104.9903],
  "memphis, tn": [35.1495, -90.049],
  "columbus, oh": [39.9612, -82.9988],
  "savannah, ga": [32.0809, -81.0912],
  "charlotte, nc": [35.2271, -80.8431],
  "houston, tx": [29.7604, -95.3698],
  "nashville, tn": [36.1627, -86.7816],
  "indianapolis, in": [39.7684, -86.1581],
  "allentown, pa": [40.6084, -75.4902],
  "kansas city, mo": [39.0997, -94.5786],
  "salt lake city, ut": [40.7608, -111.891],
  "portland, or": [45.5152, -122.6784],
  "san francisco, ca": [37.7749, -122.4194],
  "sacramento, ca": [38.5816, -121.4944],
  "san diego, ca": [32.7157, -117.1611],
  "las vegas, nv": [36.1699, -115.1398],
  "san antonio, tx": [29.4241, -98.4936],
  "austin, tx": [30.2672, -97.7431],
  "fort worth, tx": [32.7555, -97.3308],
  "el paso, tx": [31.7619, -106.485],
  "oklahoma city, ok": [35.4676, -97.5164],
  "st. louis, mo": [38.627, -90.1994],
  "minneapolis, mn": [44.9778, -93.265],
  "milwaukee, wi": [43.0389, -87.9065],
  "detroit, mi": [42.3314, -83.0458],
  "cleveland, oh": [41.4993, -81.6944],
  "cincinnati, oh": [39.1031, -84.512],
  "pittsburgh, pa": [40.4406, -79.9959],
  "philadelphia, pa": [39.9526, -75.1652],
  "new york, ny": [40.7128, -74.006],
  "boston, ma": [42.3601, -71.0589],
  "baltimore, md": [39.2904, -76.6122],
  "washington, dc": [38.9072, -77.0369],
  "richmond, va": [37.5407, -77.436],
  "norfolk, va": [36.8508, -76.2859],
  "jacksonville, fl": [30.3322, -81.6557],
  "orlando, fl": [28.5383, -81.3792],
  "tampa, fl": [27.9506, -82.4572],
  "miami, fl": [25.7617, -80.1918],
  "louisville, ky": [38.2527, -85.7585],
  "birmingham, al": [33.5186, -86.8104],
  "new orleans, la": [29.9511, -90.0715],
  "omaha, ne": [41.2565, -95.9345],
  "albuquerque, nm": [35.0844, -106.6504],
  "tucson, az": [32.2226, -110.9747],
  "boise, id": [43.615, -116.2023],

  // State Centroids (fallback if specific city not matched)
  al: [32.806671, -86.79113],
  ak: [61.370716, -152.404419],
  az: [33.729759, -111.431221],
  ar: [34.969704, -92.373123],
  ca: [36.116203, -119.681564],
  co: [39.059811, -105.311104],
  ct: [41.597782, -72.755371],
  de: [39.318523, -75.507141],
  fl: [27.766279, -81.686783],
  ga: [33.040619, -83.643071],
  id: [44.240459, -114.478828],
  il: [40.349457, -88.986137],
  in: [39.849426, -86.258278],
  ia: [42.011539, -93.210526],
  ks: [38.5266, -96.726486],
  ky: [37.66814, -84.670067],
  la: [31.169546, -91.867805],
  me: [44.693947, -69.381927],
  md: [39.063946, -76.802101],
  ma: [42.230171, -71.530106],
  mi: [43.326618, -84.536095],
  mn: [45.694454, -93.900192],
  ms: [32.741646, -89.678696],
  mo: [38.456085, -92.288368],
  mt: [46.921925, -110.454353],
  ne: [41.12537, -98.268082],
  nv: [38.313515, -117.055374],
  nh: [43.452492, -71.563896],
  nj: [40.298904, -74.521011],
  nm: [34.840515, -106.248482],
  ny: [42.165726, -74.948051],
  nc: [35.630066, -79.806419],
  nd: [47.528912, -99.784012],
  oh: [40.388783, -82.764915],
  ok: [35.565342, -96.928917],
  or: [44.572021, -122.070938],
  pa: [40.590752, -77.209755],
  ri: [41.680893, -71.51178],
  sc: [33.856892, -80.945007],
  sd: [44.299782, -99.438828],
  tn: [35.747845, -86.692345],
  tx: [31.054487, -97.563461],
  ut: [40.150032, -111.862434],
  vt: [44.045876, -72.710686],
  va: [37.769337, -78.169968],
  wa: [47.400902, -121.490494],
  wv: [38.491226, -80.954453],
  wi: [44.268543, -89.616508],
  wy: [42.755966, -107.30249],
};

export function parseCityStateFromAddress(
  city?: string | null,
  state?: string | null,
  address?: string | null
): { city: string; state: string } {
  let c = (city || "").trim();
  let s = (state || "").trim();

  if ((!c || !s) && address) {
    const raw = address.trim();
    // Check if address is in "City, ST" or "City, ST 12345" or "123 Main St, City, ST 12345"
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const stateZipMatch = lastPart.match(/^([A-Za-z]{2})(?:\s+\d{5})?$/);
      if (stateZipMatch) {
        if (!s) s = stateZipMatch[1];
        if (!c) c = parts[parts.length - 2];
      } else {
        const stateWordMatch = lastPart.match(/\b([A-Za-z]{2})\b/);
        if (stateWordMatch && !s) {
          s = stateWordMatch[1];
          if (!c) c = parts[parts.length - 2];
        }
      }
    } else if (parts.length === 1 && !c) {
      c = parts[0];
    }
  }

  return { city: c, state: s };
}

export function resolveCoordinates(
  city?: string | null,
  state?: string | null,
  address?: string | null,
  coords?: { lat?: number | null; lng?: number | null } | null
): [number, number] {
  if (
    coords &&
    typeof coords.lat === "number" &&
    !isNaN(coords.lat) &&
    typeof coords.lng === "number" &&
    !isNaN(coords.lng)
  ) {
    return [coords.lat, coords.lng];
  }

  const { city: c, state: s } = parseCityStateFromAddress(city, state, address);

  if (c && s) {
    const key = `${c.toLowerCase()}, ${s.toLowerCase()}`;
    if (US_COORDINATE_MAP[key]) {
      return US_COORDINATE_MAP[key];
    }
  }

  if (s) {
    const stateKey = s.toLowerCase();
    if (US_COORDINATE_MAP[stateKey]) {
      return US_COORDINATE_MAP[stateKey];
    }
  }

  if (c) {
    const cityLower = c.toLowerCase();
    for (const [key, mapCoords] of Object.entries(US_COORDINATE_MAP)) {
      if (key.startsWith(cityLower + ",")) {
        return mapCoords;
      }
    }
  }

  // Fallback to Geographic Center of the contiguous US
  return [39.8283, -98.5795];
}

// Calculate driving distance in miles using the Haversine formula
export function calculateHaversineDistanceMiles(
  start: [number, number],
  end: [number, number]
): number {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Highway road routing is typically ~1.17x straight-line distance
  return Math.round(R * c * 1.17);
}

export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export interface RouteCalculationResult {
  distanceMiles: number;
  durationText?: string;
  source: "osrm" | "haversine";
}
