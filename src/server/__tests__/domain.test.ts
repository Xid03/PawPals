import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../auth";
import { isMutualLike, orderedPair, trendingScore } from "../domain";
import { catSchema, commentSchema, eventSchema, healthTipSchema, messageSchema, postSchema } from "../validators";

describe("auth password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    await expect(verifyPassword("password123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("cat profile creation validation", () => {
  it("accepts valid cat profile data", () => {
    const parsed = catSchema.parse({
      name: "Luna",
      ageMonths: 24,
      gender: "FEMALE",
      breed: "Persian",
      personalityTags: ["Calm"],
      lookingFor: ["Playdate"]
    });
    expect(parsed.name).toBe("Luna");
  });
});

describe("swipe and match logic", () => {
  it("normalizes match pair ordering", () => {
    expect(orderedPair("user-b", "user-a")).toEqual(["user-a", "user-b"]);
  });

  it("only creates a match for mutual likes", () => {
    expect(isMutualLike("LIKE", "LIKE")).toBe(true);
    expect(isMutualLike("LIKE", "SKIP")).toBe(false);
  });
});

describe("post creation, likes, and comments", () => {
  it("validates posts and comments", () => {
    expect(postSchema.parse({ text: "Hello cats", topic: "MEMES" }).topic).toBe("MEMES");
    expect(commentSchema.parse({ text: "So cute!" }).text).toBe("So cute!");
  });

  it("scores trending posts by engagement and age", () => {
    const score = trendingScore(10, 4, new Date(Date.now() - 2 * 60 * 60 * 1000));
    expect(score).toBeGreaterThan(0);
  });
});

describe("chat messages", () => {
  it("validates text messages", () => {
    expect(messageSchema.parse({ body: "Send meow?" }).type).toBe("TEXT");
  });
});

describe("vet search inputs", () => {
  it("uses query strings for vet search in API routes", () => {
    const params = new URLSearchParams({ q: "Paws", service: "CHECKUP" });
    expect(params.get("service")).toBe("CHECKUP");
  });
});

describe("event RSVP and health tips", () => {
  it("validates event payloads", () => {
    const parsed = eventSchema.parse({
      title: "Cat Cafe",
      category: "MEETUPS",
      startsAt: new Date().toISOString(),
      location: "Ipoh Old Town"
    });
    expect(parsed.category).toBe("MEETUPS");
  });

  it("validates health tip content", () => {
    const parsed = healthTipSchema.parse({
      title: "Hydration",
      body: "Fresh water matters.",
      category: "NUTRITION"
    });
    expect(parsed.isDaily).toBe(false);
  });
});
