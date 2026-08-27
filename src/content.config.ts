import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const navigationType = z.enum([
  "lidar",
  "rtk",
  "vision",
  "boundary-wire",
  "hybrid",
]);

const optionalUrl = z
  .union([z.url(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const listings = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/listings",
  }),
  schema: z.object({
    title: z.string().min(1),
    brand: z.string().min(1),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug must be lowercase kebab-case (e.g. segway-navimow-x390)",
      ),
    model: z.string().min(1),
    status: z.enum(["published", "draft"]),
    priceUsd: z.number().positive().optional(),
    priceNote: z.string(),
    coverageAcres: z.number().positive(),
    slopePercent: z.number().nonnegative().optional(),
    navigation: z
      .union([navigationType, z.array(navigationType).min(1)])
      .transform((value) => (Array.isArray(value) ? value : [value])),
    wireFree: z.boolean(),
    whoItsFor: z.string().min(1),
    verdict: z.string().min(1),
    affiliateUrl: optionalUrl,
    officialUrl: z.url(),
    image: z.string().optional(),
    updated: z.coerce.date(),
    // Optional extras for the spec table. Omit rather than guess.
    cuttingWidthIn: z.number().positive().optional(),
    cuttingHeight: z.string().optional(),
    noiseDb: z.number().positive().optional(),
    weightLbs: z.number().positive().optional(),
    ipRating: z.string().optional(),
    driveType: z.string().optional(),
  }).superRefine((listing, ctx) => {
    if (listing.status !== "published") return;
    const expected = `/mowers/${listing.slug}.webp`;
    if (listing.image !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["image"],
        message: `Published listings require image: ${expected}`,
      });
    }
  }),
});

export const collections = { listings };
