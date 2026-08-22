import { z } from "zod";

export const createWatchSchema = z.object({
  name: z.string().min(1, "Názov je povinný").max(100),
  category: z.string().min(2).max(4),
  keywords: z.array(z.string()).default([]),
  minPrice: z.number().int().min(0).nullable().optional(),
  maxPrice: z.number().int().min(0).nullable().optional(),
  countries: z
    .array(z.enum(["SK", "CZ"]))
    .min(1, "Vyberte aspoň jednu krajinu")
    .default(["SK", "CZ"]),
});

export const updateWatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(2).max(4).optional(),
  keywords: z.array(z.string()).optional(),
  minPrice: z.number().int().min(0).nullable().optional(),
  maxPrice: z.number().int().min(0).nullable().optional(),
  countries: z
    .array(z.enum(["SK", "CZ"]))
    .min(1, "Vyberte aspoň jednu krajinu")
    .optional(),
  isActive: z.boolean().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const createPhoneWatchSchema = z.object({
  phone: z.string().min(9, "Telefónne číslo je povinné").max(32),
  label: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updatePhoneWatchSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
  phone: z.string().min(9).max(32).optional(),
});
