import { z } from "zod";

export const idSchema = z.object({ id: z.string().min(1) });

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(300).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isPrivate: z.boolean().optional()
});

export const catSchema = z.object({
  name: z.string().min(1).max(80),
  ageMonths: z.number().int().min(0).max(360),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  breed: z.string().min(1).max(80),
  personalityTags: z.array(z.string().min(1).max(32)).max(12).default([]),
  lookingFor: z.array(z.string().min(1).max(32)).max(12).default([]),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  description: z.string().max(600).nullable().optional()
});

export const catQuerySchema = z.object({
  ageMin: z.coerce.number().int().min(0).optional(),
  ageMax: z.coerce.number().int().min(0).optional(),
  breed: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  city: z.string().optional(),
  personality: z.string().optional(),
  q: z.string().optional()
});

export const swipeSchema = z.object({
  catId: z.string().min(1),
  action: z.enum(["LIKE", "SKIP"])
});

export const postSchema = z.object({
  text: z.string().min(1).max(2000),
  topic: z.enum(["HEALTH", "BEHAVIOR", "FOOD", "GENERAL", "MEMES"]).default("GENERAL"),
  mediaUrls: z.array(z.string().url().or(z.string().startsWith("/"))).max(8).default([])
});

export const commentSchema = z.object({
  text: z.string().min(1).max(600)
});

export const storySchema = z.object({
  url: z.string().url().or(z.string().startsWith("/")),
  type: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  caption: z.string().max(280).optional()
});

export const conversationSchema = z.object({
  userId: z.string().min(1)
});

export const messageSchema = z.object({
  body: z.string().min(1).max(2000),
  type: z.enum(["TEXT", "IMAGE", "STICKER"]).default("TEXT")
});

export const eventSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(1000).optional(),
  category: z.enum(["NEARBY", "WORKSHOPS", "MEETUPS", "ADOPTION"]),
  imageUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  startsAt: z.string().datetime(),
  location: z.string().min(1).max(160),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

export const healthTipSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(4000),
  category: z.enum(["NUTRITION", "GROOMING", "BEHAVIOR", "WELLNESS", "PREVENTIVE_CARE"]),
  imageUrl: z.string().url().or(z.string().startsWith("/")).optional(),
  isDaily: z.boolean().default(false)
});

export const notificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    "NEW_MATCH",
    "NEW_MESSAGE",
    "POST_LIKE",
    "POST_COMMENT",
    "EVENT_REMINDER",
    "FOLLOW_REQUEST"
  ]),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(400),
  data: z.record(z.string(), z.unknown()).optional()
});
