import type { CollectionEntry } from "astro:content";
import { coverageBand, formatAcres, formatNav, formatPrice, type FaqItem } from "./site";

type Listing = CollectionEntry<"listings">;

/**
 * Published listings in the larger-yards band (coverage over 1.5 acres)
 * besides the Lawn Mower Pro. The comparison table on that page copies
 * these listings; the build fails if the set changes.
 */
export const LARGER_YARD_COMPARISON_SLUGS = [
  "segway-navimow-x390",
  "husqvarna-automower-440-iq",
  "lymow-one-plus-10a",
  "yarbo-y40p-lawn-mower-pro",
  "mammotion-luba-2-awd-10000hx",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatChecked(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function mustInclude(source: string, phrase: string, where: string, label = "Yarbo FAQ"): void {
  if (!source.includes(phrase)) {
    throw new Error(`${label} expected ${JSON.stringify(phrase)} in ${where}`);
  }
}

/** Stock wording from the price note only. Historical body text is not a current claim. */
function stockSentence(note: string): string {
  if (note.includes("InStock") || /\bin stock\b/i.test(note)) return " The offer was in stock.";
  if (/\b(sold out|out of stock)\b/i.test(note)) return " The offer was out of stock.";
  return "";
}

function listingBody(listing: Listing): string {
  const body = listing.body;
  if (!body) throw new Error("Yarbo listing body is missing; FAQ cannot be checked against it.");
  return body;
}

/**
 * Fail the build when a new published listing enters the larger-yards band,
 * so the hardcoded comparison on the Yarbo page cannot go stale.
 */
export function assertLargerYardPeers(listings: Listing[]): void {
  const peers = listings
    .filter(
      (item) => item.data.slug !== "yarbo-lawn-mower-pro" && coverageBand(item.data.coverageAcres) === "over-1.5",
    )
    .map((item) => item.data.slug)
    .sort();
  const expected = [...LARGER_YARD_COMPARISON_SLUGS].sort();
  if (peers.join("|") !== expected.join("|")) {
    throw new Error(
      `Yarbo larger-yard comparison is out of date. Published over-1.5 listings: ${peers.join(", ") || "(none)"}.`,
    );
  }
}

function yarboFaqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listingBody(listing);
  const note = data.priceNote;
  if (data.priceUsd === undefined) throw new Error("Yarbo FAQ missing priceUsd");
  if (data.slopePercent === undefined) throw new Error("Yarbo FAQ missing slopePercent");
  if (data.cuttingWidthIn === undefined) throw new Error("Yarbo FAQ missing cuttingWidthIn");
  if (!data.cuttingHeight) throw new Error("Yarbo FAQ missing cuttingHeight");
  if (!data.wireFree) throw new Error("Yarbo FAQ expected wireFree");
  if (data.driveType !== "Dual drive motors") throw new Error("Yarbo FAQ expected dual drive motors");

  const checked = formatChecked(data.updated);
  mustInclude(note, "$5,999.00", "priceNote");
  mustInclude(note, "no compare-at", "priceNote");
  mustInclude(note, "$5,499.00", "priceNote");
  mustInclude(note, "sale has ended", "priceNote");
  mustInclude(note, "YAR-Y40-LM", "priceNote");
  mustInclude(note, "$7,199", "priceNote");
  mustInclude(note, "All-Season Pro", "priceNote");
  mustInclude(note, "8 Sep 2026", "priceNote");
  mustInclude(note, checked, "priceNote");

  mustInclude(body, "Max Mowing Size of 6 acres (25,000 m²)", "body");
  mustInclude(body, "1.7 acres (6,880 m²)", "body");
  mustInclude(body, "120 min", "body");
  mustInclude(body, "70% (35°)", "body");
  mustInclude(body, "2 in (50 mm)", "body");
  mustInclude(body, "PPVS / RTK + multi-sensor", "body");
  mustInclude(body, "binocular cameras", "body");
  mustInclude(body, "Data Center", "body");
  mustInclude(body, "NetRTK", "body");
  mustInclude(body, "docking station", "body");
  mustInclude(body, `${data.cuttingWidthIn} in (500 mm)`, "body");
  mustInclude(body, "app/auto height from", "body");
  mustInclude(body, data.cuttingHeight, "body");
  mustInclude(body, "Dual Straight-Blade", "body");
  mustInclude(body, "2×300W", "body");
  mustInclude(data.verdict, "tracked-core", "verdict");

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Yarbo Lawn Mower Pro cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU YAR-Y40-LM, the Yarbo Core plus Lawn Mower Pro module, against a $5,999.00 compare-at. It was $5,999.00 with no compare-at on 4 Nov 2026. It was $5,499.00 against a $5,999.00 compare-at on 8 Sep 2026, so that sale has ended.${stockSentence(note)} This SKU is not the $7,199 All-Season Pro 4-in-1 (Lawn Mower Pro + Snow Blower + Blower).`,
    },
    {
      question: "How large a lawn is the Yarbo Lawn Mower Pro rated for?",
      answer: `The coverage figure is ${coverage}. That number is Yarbo’s Max Mowing Size of 6 acres (25,000 m²). The same listing also records a mowing area per day of 1.7 acres (6,880 m²) and a mowing time per charge of 120 min.`,
    },
    {
      question: "Can the Yarbo Lawn Mower Pro handle steep hills?",
      answer: `Max climbing ability is ${data.slopePercent}% (35°). Vertical obstacle clearance is 2 in (50 mm). Drive is ${data.driveType.toLowerCase()} on a modular tracked-core. A separate boundary-slope figure is not stated.`,
    },
    {
      question: "Does the Yarbo Lawn Mower Pro need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records the product-page description as PPVS / RTK + multi-sensor, with binocular cameras, ultrasonic sensors, and a bumper. The bundle includes a Data Center for local RTK, and NetRTK is noted where coverage exists. The docking station is included.`,
    },
    {
      question: "What cutting width and height does the Yarbo Lawn Mower Pro have?",
      answer: `Cutting width is ${data.cuttingWidthIn} in (500 mm). Cutting height is app/auto from ${data.cuttingHeight}. The cutting system is dual straight blades with two 300W cutting motors.`,
    },
  ];
}

function i110Faqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("i110 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "i110 FAQ";
  if (data.priceUsd !== 1099) throw new Error(`${label} expected priceUsd 1099`);
  if (data.coverageAcres !== 0.25) throw new Error(`${label} expected coverageAcres 0.25`);
  if (data.slopePercent !== 30) throw new Error(`${label} expected slopePercent 30`);
  if (data.cuttingWidthIn !== 7.1) throw new Error(`${label} expected cuttingWidthIn 7.1`);
  if (data.cuttingHeight !== "2–3.6 in, manual") throw new Error(`${label} expected cuttingHeight`);
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "Front-wheel drive") throw new Error(`${label} expected front-wheel drive`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$1,099.00", "priceNote", label);
  mustInclude(note, "no compare-at", "priceNote", label);
  mustInclude(note, "SOLD OUT", "priceNote", label);
  mustInclude(note, "AA.12.02.03.0003", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "1.2× the recommended area (0.3 acre here, layout-dependent)", "body", label);
  mustInclude(body, "30% (17°)", "body", label);
  mustInclude(body, "10% (6°)", "body", label);
  mustInclude(body, "work-area slopes over 30%", "body", label);
  mustInclude(body, "EFLS 2.0 (Network RTK plus Visual SLAM)", "body", label);
  mustInclude(body, "140° VisionFence", "body", label);
  mustInclude(body, "A local antenna remains part of the install story when Network RTK is not available.", "body", label);
  mustInclude(body, "4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.", "body", label);
  mustInclude(body, "three blades", "body", label);
  mustInclude(body, "5.1 Ah", "body", label);
  mustInclude(body, "about 120 minutes to charge", "body", label);
  mustInclude(body, "about 120 minutes of mowing", "body", label);
  mustInclude(body, "manual height 2–3.6 in", "body", label);
  mustInclude(body, data.driveType.toLowerCase(), "body", label);
  mustInclude(
    body,
    "0.125-acre i-series cart at $799 (27 Nov 2026), with the same front-wheel drive, 30% work-area slope, and 7.1-inch deck",
    "body",
    label,
  );
  mustInclude(body, "all-wheel drive at $999 (20 Nov 2026) on sale with a 45% slope rating", "body", label);
  mustInclude(body, "$1,799 (16 Oct 2026) with LiDAR, RTK, and vision", "body", label);
  mustInclude(body, "0.37-acre LiDAR + vision cart at $1,329 (20 Nov 2026) on sale", "body", label);
  mustInclude(
    body,
    "1-acre X3 at $2,299 (17 Oct 2026), rear-wheel drive, with a 50% work-area slope",
    "body",
    label,
  );

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Segway Navimow i110 cost?",
      answer: `The official US store price recorded here is ${price} on ${checked} for SKU AA.12.02.03.0003, Navimow i110 | 0.25 acre. There is no compare-at.${stockSentence(note)}`,
    },
    {
      question: "How large a lawn is the Segway Navimow i110 rated for?",
      answer: `The coverage figure is ${coverage}. That number is the recommended mowing area. The same listing also records a mapping footnote of up to 1.2× the recommended area (0.3 acre here, layout-dependent).`,
    },
    {
      question: "Can the Segway Navimow i110 handle steep hills?",
      answer: `Work-area slope is ${data.slopePercent}% (17°). Boundary slope is 10% (6°). Drive is ${data.driveType.toLowerCase()}. The listing says it is a weaker match for work-area slopes over 30%.`,
    },
    {
      question: "Does the Segway Navimow i110 need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records EFLS 2.0 (Network RTK plus Visual SLAM) and a 140° VisionFence camera. A local antenna remains part of the install story when Network RTK is not available. 4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.`,
    },
    {
      question: "What cutting width and height does the Segway Navimow i110 have?",
      answer: `Cutting width is ${data.cuttingWidthIn} in. Cutting height is ${data.cuttingHeight}. The cutting system is three blades. The battery is 5.1 Ah, with about 120 minutes of mowing and about 120 minutes to charge.`,
    },
    {
      question: "How does the Segway Navimow i110 compare with the listed i105 and X330?",
      answer:
        "The listed i105 is the 0.125-acre i-series cart at $799 (27 Nov 2026), with the same front-wheel drive, 30% work-area slope, and 7.1-inch deck. The listed X330 is the 1-acre X3 at $2,299 (17 Oct 2026), rear-wheel drive, with a 50% work-area slope. It is a weaker match for 0.125-acre lots that only need the i105, for anything in X3/X4 acreage.",
    },
    {
      question: "How does the Segway Navimow i110 compare with the listed i210 AWD, H210, and i215 LiDAR?",
      answer:
        "The same-acreage i210 AWD is all-wheel drive at $999 (20 Nov 2026) on sale with a 45% slope rating. The same-acreage H210 is $1,799 (16 Oct 2026) with LiDAR, RTK, and vision. The i215 LiDAR is the 0.37-acre LiDAR + vision cart at $1,329 (20 Nov 2026) on sale.",
    },
  ];
}

function a2000Faqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("A2000 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "A2000 FAQ";
  if (data.priceUsd !== 1329) throw new Error(`${label} expected priceUsd 1329`);
  if (data.coverageAcres !== 0.5) throw new Error(`${label} expected coverageAcres 0.5`);
  if (data.slopePercent !== 50) throw new Error(`${label} expected slopePercent 50`);
  if (data.cuttingWidthIn !== 12.96) throw new Error(`${label} expected cuttingWidthIn 12.96`);
  if (data.cuttingHeight !== "1.18–3.54 in (30–90 mm), electric adjustment") {
    throw new Error(`${label} expected cuttingHeight`);
  }
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType) throw new Error(`${label} expected no published driveType`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$1,999.99", "priceNote", label);
  mustInclude(note, "GA2000LP", "priceNote", label);
  mustInclude(note, "off $0.00", "priceNote", label);
  mustInclude(note, "no coupons", "priceNote", label);
  mustInclude(note, "$1,452.00", "priceNote", label);
  mustInclude(note, "promotion has ended", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "2,000 m² (1/2 acre)", "body", label);
  mustInclude(body, "50% (27°)", "body", label);
  mustInclude(body, "Maximum virtual-boundary slope", "body", label);
  mustInclude(body, "slopes above 50%", "body", label);
  mustInclude(body, "ECOVACS does not publish a drive type", "body", label);
  mustInclude(body, "HoloScope 360 Dual-LiDAR", "body", label);
  mustInclude(body, "360° rotating LiDAR plus a 3D time-of-flight LiDAR", "body", label);
  mustInclude(body, "AI camera (AIVI 3D)", "body", label);
  mustInclude(body, "No perimeter wire, RTK antenna, or RTK reference station in the box.", "body", label);
  mustInclude(body, "purchased", "body", label);
  mustInclude(body, "GOAT Cellular Module Pro separately for A-series models.", "body", label);
  mustInclude(body, "12.96 in", "body", label);
  mustInclude(body, "1.18–3.54 in", "body", label);
  mustInclude(body, "dual blade discs", "body", label);
  mustInclude(body, "3,000 mAh / 3.0 Ah", "body", label);
  mustInclude(body, "50 min", "body", label);
  mustInclude(body, "50±5 min", "body", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the ECOVACS GOAT A2000 LiDAR PRO cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU GA2000LP, the mower-only GOAT A2000 LiDAR PRO. Present is ${price} against a $1,999.99 origin, off $671.00, with no coupons.${stockSentence(note)} It was $1,999.99 present and origin, off $0.00, with no coupons on 21 Oct 2026. It was $1,452.00 present against $1,999.99 origin on 30 Sep 2026, so that promotion has ended.`,
    },
    {
      question: "How large a lawn is the ECOVACS GOAT A2000 LiDAR PRO rated for?",
      answer: `The coverage figure is ${coverage}. That number is ECOVACS' 1/2-acre figure for a working capacity of 2,000 m² (1/2 acre).`,
    },
    {
      question: "Can the ECOVACS GOAT A2000 LiDAR PRO handle steep hills?",
      answer: `Work-area slope is ${data.slopePercent}% (27°). Virtual-boundary slope is 20%. ECOVACS does not publish a drive type for this SKU. The listing says to look elsewhere if the mowing area includes slopes above 50%.`,
    },
    {
      question: "Does the ECOVACS GOAT A2000 LiDAR PRO need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records HoloScope 360 Dual-LiDAR: a 360° rotating LiDAR plus a 3D time-of-flight LiDAR, with an AI camera (AIVI 3D). No perimeter wire, RTK antenna, or RTK reference station is in the box. Cellular / GNSS appear in the manual as purchased options; the US store sells a GOAT Cellular Module Pro separately for A-series models.`,
    },
    {
      question: "What cutting width and height does the ECOVACS GOAT A2000 LiDAR PRO have?",
      answer: `Cutting width is ${data.cuttingWidthIn} in. Cutting height is ${data.cuttingHeight}. The cutting system is dual blade discs. The battery is 3,000 mAh / 3.0 Ah, with 50 min of mowing per charge on the page spec table and a manual charging time of 50±5 min.`,
    },
  ];
}

function m5LidarFaqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("M5 LiDAR listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "M5 LiDAR FAQ";
  if (data.priceUsd !== 759) throw new Error(`${label} expected priceUsd 759`);
  if (data.coverageAcres !== 0.12) throw new Error(`${label} expected coverageAcres 0.12`);
  if (data.slopePercent !== 45) throw new Error(`${label} expected slopePercent 45`);
  if (data.cuttingWidthIn !== 7.9) throw new Error(`${label} expected cuttingWidthIn 7.9`);
  if (data.cuttingHeight !== "3–7 cm (1.2–2.8 in), app-adjusted") {
    throw new Error(`${label} expected cuttingHeight`);
  }
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "2 rear wheels") throw new Error(`${label} expected 2 rear wheels`);
  if (data.navigation.join(",") !== "lidar,vision") throw new Error(`${label} expected lidar + vision`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$759.00", "priceNote", label);
  mustInclude(note, "$949.00", "priceNote", label);
  mustInclude(note, "105010083", "priceNote", label);
  mustInclude(note, "2 Nov 2026", "priceNote", label);
  mustInclude(note, "$799.00", "priceNote", label);
  mustInclude(note, "21 Oct 2026", "priceNote", label);
  mustInclude(note, "had ended by 2 Nov", "priceNote", label);
  mustInclude(note, "compare-at also $949.00 (no sale)", "priceNote", label);
  mustInclude(note, "M5 LiDAR + Garage", "priceNote", label);
  mustInclude(note, "not this SKU's price", "priceNote", label);
  mustInclude(note, "105010082", "priceNote", label);
  mustInclude(note, "$549 on 11 Nov 2026", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "no perimeter wire and no RTK station required", "body", label);
  mustInclude(body, "360° LiDAR + Dual Vision", "body", label);
  mustInclude(body, "Recommended Mowing Area of 500 m² (1/8 Acres)", "body", label);
  mustInclude(body, "0.12 acre", "body", label);
  mustInclude(body, "up to 500 m²", "body", label);
  mustInclude(body, "Same published footprint class as listed base M5", "body", label);
  mustInclude(body, "M9’s 1000 m² class", "body", label);
  mustInclude(body, "Full-Band RTK + Dual Vision", "body", label);
  mustInclude(body, "105010082", "body", label);
  mustInclude(body, "$549 on 11 Nov 2026", "body", label);
  mustInclude(body, "24° / 45%", "body", label);
  mustInclude(body, "20 cm (7.9 in)", "body", label);
  mustInclude(body, "3–7 cm (1.2–2.8 in)", "body", label);
  mustInclude(body, "2 rear wheels", "body", label);
  mustInclude(body, "different brand/product from listed", "body", label);
  mustInclude(body, "ECOVACS GOAT A3000 LiDAR PRO", "body", label);
  mustInclude(body, "listed **Anthbot M9**", "body", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "Does the Anthbot M5 LiDAR need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records 360° LiDAR + Dual Vision, with no perimeter wire and no RTK station required.`,
    },
    {
      question: "How large a lawn is the Anthbot M5 LiDAR rated for?",
      answer: `The coverage figure is ${coverage}. That number is Anthbot's published Recommended Mowing Area of 500 m² (1/8 Acres). The same listing records compact gardens up to 500 m², the same published footprint class as the listed base M5, and not M9’s 1000 m² class.`,
    },
    {
      question: "How much does the Anthbot M5 LiDAR cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU 105010083, against a $949.00 compare-at. It was $949.00 with compare-at also $949.00 (no sale) on 2 Nov 2026. The $799.00 sale against a $949.00 compare-at seen on 21 Oct 2026 had ended by 2 Nov. The M5 LiDAR + Garage bundle is not this SKU's price.`,
    },
    {
      question: "How does the Anthbot M5 LiDAR compare with the listed RTK base M5?",
      answer: `The listed base Anthbot M5 is Full-Band RTK + Dual Vision, SKU 105010082, at $549 on 11 Nov 2026. This listing records the same published footprint class (up to 500 m²) and navigation of ${nav}: 360° LiDAR + Dual Vision, with no perimeter wire and no RTK station required. The M5 LiDAR price recorded here is ${price} on ${checked}.`,
    },
    {
      question: "What slope and cut does the Anthbot M5 LiDAR publish?",
      answer: `Maximum slope ability is 24° / 45%. Drive is ${data.driveType}. Cutting width is ${data.cuttingWidthIn} in (20 cm). Cutting height is ${data.cuttingHeight}.`,
    },
    {
      question: "Is the Anthbot M5 LiDAR the listed Anthbot M9 or ECOVACS GOAT A3000 LiDAR PRO?",
      answer: `No. This listing says it is not the listed Anthbot M9 (not M9’s 1000 m² class) and is a different brand and product from the listed ECOVACS GOAT A3000 LiDAR PRO.`,
    },
  ];
}

function a3Awd1000Faqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("A3 AWD 1000 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "A3 AWD 1000 FAQ";
  if (data.priceUsd !== 1099.99) throw new Error(`${label} expected priceUsd 1099.99`);
  if (data.coverageAcres !== 0.25) throw new Error(`${label} expected coverageAcres 0.25`);
  if (data.slopePercent !== 80) throw new Error(`${label} expected slopePercent 80`);
  if (data.cuttingWidthIn !== 7.9) throw new Error(`${label} expected cuttingWidthIn 7.9`);
  if (data.cuttingHeight !== "1.2–3.9 in (3–10 cm)") throw new Error(`${label} expected cuttingHeight`);
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "All-wheel drive") throw new Error(`${label} expected all-wheel drive`);
  if (data.navigation.join(",") !== "lidar,vision") throw new Error(`${label} expected lidar + vision`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$1,099.99", "priceNote", label);
  mustInclude(note, "$1,999.99", "priceNote", label);
  mustInclude(note, "010901AA000225", "priceNote", label);
  mustInclude(note, "A3 AWD 1000 - 0.25 Acre", "priceNote", label);
  mustInclude(note, "$1,399.99", "priceNote", label);
  mustInclude(note, "16 Oct 2026", "priceNote", label);
  mustInclude(note, "$1,599.99", "priceNote", label);
  mustInclude(note, "18 Sep 2026", "priceNote", label);
  mustInclude(note, "Not labeled MSRP", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "does not use RTK or a boundary wire", "body", label);
  mustInclude(body, "OmniSense™ 3.0", "body", label);
  mustInclude(body, "360° 3D LiDAR", "body", label);
  mustInclude(body, "binocular AI vision", "body", label);
  mustInclude(body, "No RTK. No Wires.", "body", label);
  mustInclude(body, "1,000 m² / 0.25 acre", "body", label);
  mustInclude(body, "0.25-acre", "body", label);
  mustInclude(body, "0.54 acre/24 hrs", "body", label);
  mustInclude(body, "throughput rates, not a higher capacity rating for this SKU", "body", label);
  mustInclude(body, "80% (38.7°)", "body", label);
  mustInclude(body, "7.9 in", "body", label);
  mustInclude(body, "1.2–3.9 in (3–10 cm)", "body", label);
  mustInclude(body, "all-wheel drive", "body", label);
  mustInclude(body, "2,000 m² / 0.50 acre", "body", label);
  mustInclude(body, "on the same PDP", "body", label);
  mustInclude(body, "not the Pro series (15.8 in dual-disc; Pro 2500 / 3500 / 5000)", "body", label);
  mustInclude(body, "1 year", "body", label);
  mustInclude(body, "complimentary 4G data", "body", label);
  mustInclude(data.verdict, "not the Pro 3500 (0.87 acre, 15.8 in dual-disc)", "verdict", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "Does the Dreame A3 AWD 1000 need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records OmniSense™ 3.0, pairing 360° 3D LiDAR with binocular AI vision, and states it does not use RTK or a boundary wire. Marketing states “No RTK. No Wires.”`,
    },
    {
      question: "How large a lawn is the Dreame A3 AWD 1000 rated for?",
      answer: `The coverage figure is ${coverage}. That number is the A3 AWD 1000 working area capacity of 1,000 m² / 0.25 acre. The same listing records power-mode throughput of Standard 0.25, Efficient 0.50, and Rush 0.54 acre/24 hrs, which are throughput rates, not a higher capacity rating for this SKU.`,
    },
    {
      question: "How much does the Dreame A3 AWD 1000 cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU 010901AA000225, variant A3 AWD 1000 - 0.25 Acre, against a $1,999.99 compare-at. It was $1,399.99 on 16 Oct 2026 and $1,599.99 on 18 Sep 2026. Not labeled MSRP.`,
    },
    {
      question: "How does the Dreame A3 AWD 1000 compare with the listed A3 AWD 2000 and A3 AWD Pro 3500?",
      answer: `This listing is the 0.25-acre non-Pro SKU with a 7.9 in cut. The A3 AWD 2000 on the same PDP is 2,000 m² / 0.50 acre. This is not the Pro 3500 (0.87 acre, 15.8 in dual-disc) and not the Pro series (15.8 in dual-disc; Pro 2500 / 3500 / 5000).`,
    },
    {
      question: "What slope and cut does the Dreame A3 AWD 1000 publish?",
      answer: `Max slope is ${data.slopePercent}% (38.7°). Drive is ${data.driveType.toLowerCase()}. Cutting width is ${data.cuttingWidthIn} in. Cutting height is ${data.cuttingHeight}.`,
    },
    {
      question: "Does the Dreame A3 AWD 1000 include 4G?",
      answer: `PDP marketing lists 1 year of complimentary 4G data.`,
    },
  ];
}

function genie3000Faqs(listing: Listing): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("Genie 3000 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "Genie 3000 FAQ";
  if (data.priceUsd !== 899) throw new Error(`${label} expected priceUsd 899`);
  if (data.coverageAcres !== 0.75) throw new Error(`${label} expected coverageAcres 0.75`);
  if (data.slopePercent !== 45) throw new Error(`${label} expected slopePercent 45`);
  if (data.cuttingWidthIn !== 7.9) throw new Error(`${label} expected cuttingWidthIn 7.9`);
  if (data.cuttingHeight !== "3–7 cm (1.2–2.8 in), app/auto") {
    throw new Error(`${label} expected cuttingHeight`);
  }
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "2 rear wheels") throw new Error(`${label} expected 2 rear wheels`);
  if (data.navigation.join(",") !== "rtk,vision") throw new Error(`${label} expected rtk + vision`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$899.00", "priceNote", label);
  mustInclude(note, "105010042", "priceNote", label);
  mustInclude(note, "$1,599.00", "priceNote", label);
  mustInclude(note, "SOLD OUT", "priceNote", label);
  mustInclude(note, "22 Oct 2026", "priceNote", label);
  mustInclude(note, "already sold out", "priceNote", label);
  mustInclude(note, "10 Sep 2026", "priceNote", label);
  mustInclude(note, "Genie 600 $799", "priceNote", label);
  mustInclude(note, "Genie 600e(4G) $699", "priceNote", label);
  mustInclude(note, "Genie 1000 $799", "priceNote", label);
  mustInclude(note, "are not this SKU's price", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "no perimeter wire", "body", label);
  mustInclude(body, "full-band RTK + 3D vision (4 cameras)", "body", label);
  mustInclude(body, "RTK reference station", "body", label);
  mustInclude(body, "Recommended Mowing Area of 3000㎡ (3/4 Acres)", "body", label);
  mustInclude(body, "0.75 acre", "body", label);
  mustInclude(body, "0.89 acre / up to 3600 m²", "body", label);
  mustInclude(body, "marketed ceiling", "body", label);
  mustInclude(body, "recommended yard-fit", "body", label);
  mustInclude(body, "~3000 m² / 3/4 acre", "body", label);
  mustInclude(body, "Genie 600e (4G)", "body", label);
  mustInclude(body, "105010062", "body", label);
  mustInclude(body, "$699", "body", label);
  mustInclude(body, "recommended ~600 m²", "body", label);
  mustInclude(body, "105010025", "body", label);
  mustInclude(body, "$799", "body", label);
  mustInclude(body, "recommended ~1000 m² / 1/4 acre", "body", label);
  mustInclude(body, "Anti-Theft Digital Fence", "body", label);
  mustInclude(body, "exclusive to Genie 1000 & Genie 3000", "body", label);
  mustInclude(body, "24° / 45%", "body", label);
  mustInclude(body, "2 Rear Wheels", "body", label);
  mustInclude(body, "20 cm (7.9 inch)", "body", label);
  mustInclude(body, "3–7 cm (1.2–2.8 in)", "body", label);
  mustInclude(body, "1 year free", "body", label);
  mustInclude(body, "4G / Connect+", "body", label);
  mustInclude(body, "$39.90", "body", label);
  mustInclude(body, "GPS Tracking", "body", label);
  mustInclude(body, "Out-of-Boundary Alarm", "body", label);
  mustInclude(body, "Find My", "body", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Anthbot Genie 3000 cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU 105010042, Genie 3000 | 0.89 acre, against a $1,599.00 compare-at.${stockSentence(note)} Sibling variants on the same configurable product on 10 Sep 2026 (Genie 600 $799, Genie 600e(4G) $699, Genie 1000 $799) are not this SKU's price.`,
    },
    {
      question: "How large a lawn is the Anthbot Genie 3000 rated for?",
      answer: `The coverage figure is ${coverage}. That number is Anthbot’s Recommended Mowing Area of 3000㎡ (3/4 Acres), the recommended yard-fit. The same listing records a marketed ceiling of 0.89 acre / up to 3600 m², which is not the recommended yard-fit.`,
    },
    {
      question: "Does the Anthbot Genie 3000 need a boundary wire?",
      answer: `No. It is wire-free. Navigation is ${nav}. This listing records full-band RTK + 3D vision (4 cameras), with no perimeter wire. The packaging list includes an RTK reference station.`,
    },
    {
      question: "How does the Anthbot Genie 3000 compare with the listed Genie 600e and Genie 1000?",
      answer: `The listed Genie 600e (4G) is SKU 105010062 at $699, with a recommended ~600 m² area. The listed Genie 1000 is SKU 105010025 at $799, with a recommended ~1000 m² / 1/4 acre area. This listing’s recommended area is ~3000 m² / 3/4 acre, and its marketed ceiling is 0.89 acre / up to 3600 m². The price recorded here is ${price} on ${checked}. Anti-Theft Digital Fence is called out as exclusive to Genie 1000 & Genie 3000.`,
    },
    {
      question: "What slope and cut does the Anthbot Genie 3000 publish?",
      answer: `Maximum slope ability is 24° / 45%. Driving engine is 2 Rear Wheels. Cutting width is 20 cm (7.9 inch). Cutting height is ${data.cuttingHeight}.`,
    },
    {
      question: "Does the Anthbot Genie 3000 include 4G?",
      answer: `Yes. Specs list 1 year free 4G / Connect+ (renewable annually at $39.90). GPS Tracking, Out-of-Boundary Alarm, and Find My are Y on Genie 3000.`,
    },
  ];
}

function priceOn(item: Listing, label: string): string {
  if (item.data.priceUsd === undefined) {
    throw new Error(`${label} listing ${item.data.slug} has no priceUsd`);
  }
  return `${formatPrice(item.data.priceUsd)} (${formatChecked(item.data.updated)})`;
}

function navimowPeer(listings: readonly Listing[], slug: string, label: string): Listing {
  const item = listings.find((entry) => entry.data.slug === slug);
  if (!item) throw new Error(`${label} missing published listing ${slug}`);
  if (item.data.brand !== "Segway Navimow") {
    throw new Error(`${label} ${slug} is not a Segway Navimow listing`);
  }
  return item;
}

function i105Faqs(listing: Listing, listings: readonly Listing[]): FaqItem[] {
  const data = listing.data;
  const body = listing.body;
  if (!body) throw new Error("i105 listing body is missing; FAQ cannot be checked against it.");
  const note = data.priceNote;
  const label = "i105 FAQ";
  if (data.priceUsd !== 799) throw new Error(`${label} expected priceUsd 799`);
  if (data.coverageAcres !== 0.125) throw new Error(`${label} expected coverageAcres 0.125`);
  if (data.slopePercent !== 30) throw new Error(`${label} expected slopePercent 30`);
  if (data.cuttingWidthIn !== 7.1) throw new Error(`${label} expected cuttingWidthIn 7.1`);
  if (data.cuttingHeight !== "2–3.6 in, manual") throw new Error(`${label} expected cuttingHeight`);
  if (!data.wireFree) throw new Error(`${label} expected wireFree`);
  if (data.driveType !== "Front-wheel drive") throw new Error(`${label} expected front-wheel drive`);
  if (data.navigation.join(",") !== "rtk,vision") throw new Error(`${label} expected rtk + vision`);

  const checked = formatChecked(data.updated);
  mustInclude(note, "$799.00", "priceNote", label);
  mustInclude(note, "no compare-at", "priceNote", label);
  mustInclude(note, "AA.12.02.02.0001", "priceNote", label);
  mustInclude(note, "Navimow i105 | 0.125 acre", "priceNote", label);
  mustInclude(note, "$669.00 sale from a $799.00 compare-at", "priceNote", label);
  mustInclude(note, "23 Oct 2026", "priceNote", label);
  mustInclude(note, "has ended", "priceNote", label);
  mustInclude(note, "available=false", "priceNote", label);
  mustInclude(note, checked, "priceNote", label);

  mustInclude(body, "recommended mowing area 0.125 acre", "body", label);
  mustInclude(body, "FAQ maximum about 0.15 acre depending on layout (1.2× the recommended area)", "body", label);
  mustInclude(body, "30% (17°)", "body", label);
  mustInclude(body, "10% (6°)", "body", label);
  mustInclude(body, "work-area slopes over 30%", "body", label);
  mustInclude(body, "perimeter-wire-free", "body", label);
  mustInclude(body, "EFLS 2.0 (Network RTK plus Visual SLAM)", "body", label);
  mustInclude(body, "140° VisionFence", "body", label);
  mustInclude(body, "Antenna-free setup is available where Network RTK coverage exists", "body", label);
  mustInclude(body, "A local antenna remains part of the install story when Network RTK is not available.", "body", label);
  mustInclude(body, "4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.", "body", label);
  mustInclude(body, "height not less than 40 cm", "body", label);
  mustInclude(body, "width not less than 100 cm", "body", label);
  mustInclude(data.whoItsFor, "narrower than 100 cm (39.4 in)", "whoItsFor", label);
  mustInclude(body, "2.55 Ah", "body", label);
  mustInclude(body, "about 60 minutes of mowing", "body", label);
  mustInclude(body, "5.1 Ah / 120 min / 80–120 m²", "body", label);
  mustInclude(body, "0.25-acre sibling", "body", label);
  mustInclude(body, "a layout-dependent maximum of about 0.15 acre, the i110 about 0.3 acre", "body", label);

  const i110 = navimowPeer(listings, "segway-navimow-i110", label);
  const h210 = navimowPeer(listings, "segway-navimow-h210", label);
  const h220 = navimowPeer(listings, "segway-navimow-h220", label);
  if (i110.data.coverageAcres !== 0.25 || i110.data.slopePercent !== 30) {
    throw new Error(`${label} choosing copy expected i110 coverage 0.25 and slope 30`);
  }
  if (i110.data.cuttingWidthIn !== 7.1 || i110.data.driveType !== "Front-wheel drive") {
    throw new Error(`${label} choosing copy expected i110 7.1 in front-wheel drive`);
  }
  if (h210.data.coverageAcres !== 0.25 || h210.data.slopePercent !== 45) {
    throw new Error(`${label} choosing copy expected H210 coverage 0.25 and slope 45`);
  }
  if (h210.data.navigation.join(",") !== "lidar,rtk,vision") {
    throw new Error(`${label} choosing copy expected H210 LiDAR, RTK, and vision`);
  }
  if (h220.data.coverageAcres !== 0.5 || h220.data.slopePercent !== 45) {
    throw new Error(`${label} choosing copy expected H220 coverage 0.5 and slope 45`);
  }
  if (h220.data.navigation.join(",") !== "lidar,rtk,vision") {
    throw new Error(`${label} choosing copy expected H220 LiDAR, RTK, and vision`);
  }

  const i110Choice = `0.25-acre i-series cart at ${priceOn(i110, label)}, with the same front-wheel drive, 30% work-area slope, and 7.1-inch deck`;
  const h210Choice = `${priceOn(h210, label)} with LiDAR, RTK, and vision at 0.25 acre and a 45% slope`;
  const h220Choice = `0.5-acre cart at ${priceOn(h220, label)} with LiDAR, RTK, and vision and a 45% slope`;
  mustInclude(
    body,
    "Choose a listed Navimow sibling when the lawn does not match this 0.125-acre front-wheel-drive cart.",
    "body",
    label,
  );
  mustInclude(body, i110Choice, "body", label);
  mustInclude(body, h210Choice, "body", label);
  mustInclude(body, h220Choice, "body", label);

  const price = formatPrice(data.priceUsd);
  const coverage = formatAcres(data.coverageAcres);
  const nav = formatNav(data.navigation);

  return [
    {
      question: "How much does the Segway Navimow i105 cost?",
      answer: `The official US cart price recorded here is ${price} on ${checked} for SKU AA.12.02.02.0001, Navimow i105 | 0.125 acre, with no compare-at. The $669.00 sale from a $799.00 compare-at seen on 23 Oct 2026 has ended. A guest cart accepted the variant even though product.js reports available=false.`,
    },
    {
      question: "How large a lawn is the Segway Navimow i105 rated for?",
      answer: `The coverage figure is ${coverage}. That number is the recommended mowing area 0.125 acre. The same listing also records an FAQ maximum about 0.15 acre depending on layout (1.2× the recommended area).`,
    },
    {
      question: "Does the Segway Navimow i105 need a boundary wire or a local antenna?",
      answer: `No boundary wire. It is wire-free. Navigation is ${nav}. This listing records a perimeter-wire-free mower with EFLS 2.0 (Network RTK plus Visual SLAM) and a 140° VisionFence camera. Antenna-free setup is available where Network RTK coverage exists. A local antenna remains part of the install story when Network RTK is not available.`,
    },
    {
      question: "What slope does the Segway Navimow i105 handle?",
      answer: `Work-area slope is ${data.slopePercent}% (17°). Boundary slope is 10% (6°). Drive is ${data.driveType.toLowerCase()}. The listing says it is a weaker match for work-area slopes over 30%.`,
    },
    {
      question: "Does the Segway Navimow i105 include 4G or anti-theft?",
      answer:
        "No. 4G connectivity and anti-theft/GPS tracking require a separate Navimow Access+ 4G module.",
    },
    {
      question: "How wide a passage does the Segway Navimow i105 need?",
      answer:
        "The passage FAQ for Navimow-i says height not less than 40 cm and width not less than 100 cm. Skip it if a passage is narrower than 100 cm (39.4 in).",
    },
    {
      question: "How does the Segway Navimow i105 compare with the listed i110?",
      answer: `The listed i110 is the ${i110Choice}. This listing’s i105 column is a 2.55 Ah battery and about 60 minutes of mowing. The 5.1 Ah / 120 min / 80–120 m² column is the 0.25-acre sibling. This listing also records a layout-dependent maximum of about 0.15 acre, the i110 about 0.3 acre.`,
    },
    {
      question: "How does the Segway Navimow i105 compare with the listed H210 and H220?",
      answer: `The listed H210 is ${h210Choice}. The listed H220 is the ${h220Choice}.`,
    },
  ];
}

/** Visible FAQ copy for a listing page. JSON-LD must use these same strings. */
export function faqsForListing(listing: Listing, listings: readonly Listing[] = []): FaqItem[] {
  if (listing.data.slug === "yarbo-lawn-mower-pro") return yarboFaqs(listing);
  if (listing.data.slug === "segway-navimow-i110") return i110Faqs(listing);
  if (listing.data.slug === "ecovacs-goat-a2000-lidar-pro") return a2000Faqs(listing);
  if (listing.data.slug === "anthbot-m5-lidar") return m5LidarFaqs(listing);
  if (listing.data.slug === "anthbot-genie-3000") return genie3000Faqs(listing);
  if (listing.data.slug === "dreame-a3-awd-1000") return a3Awd1000Faqs(listing);
  if (listing.data.slug === "segway-navimow-i105") return i105Faqs(listing, listings);
  return [];
}
