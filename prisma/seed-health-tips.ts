import { PrismaClient, type HealthTipCategory } from "@prisma/client";

const healthTips = [
  {
    title: "Keep your cat hydrated",
    body: "Fresh water helps support healthy kidneys and digestion. Place bowls in quiet spots and refresh them daily.",
    category: "NUTRITION",
    isDaily: true
  },
  {
    title: "Feed age-appropriate meals",
    body: "Kittens, adults, and senior cats need different nutrient levels. Choose food that matches your cat's life stage.",
    category: "NUTRITION",
    isDaily: false
  },
  {
    title: "Brush gently and often",
    body: "Short grooming sessions help reduce stress, loose fur, and matting. Reward your cat after each session.",
    category: "GROOMING",
    isDaily: true
  },
  {
    title: "Trim claws safely",
    body: "Use cat nail clippers and trim only the clear sharp tip. Stop before the pink quick to avoid pain.",
    category: "GROOMING",
    isDaily: false
  },
  {
    title: "Understand slow blinking",
    body: "Slow blinking can be a relaxed social signal from your cat. Blink back gently to build trust.",
    category: "BEHAVIOR",
    isDaily: true
  },
  {
    title: "Give cats vertical space",
    body: "Cat trees, shelves, and window perches help cats feel secure and reduce boredom at home.",
    category: "BEHAVIOR",
    isDaily: false
  },
  {
    title: "Schedule yearly checkups",
    body: "Annual vet visits can detect dental issues, weight changes, and early signs of illness before they become serious.",
    category: "PREVENTIVE_CARE",
    isDaily: false
  },
  {
    title: "Keep vaccines updated",
    body: "Vaccines protect cats from serious diseases. Ask your vet which vaccination schedule fits your cat's lifestyle.",
    category: "PREVENTIVE_CARE",
    isDaily: false
  },
  {
    title: "Watch appetite changes",
    body: "Sudden changes in eating or drinking can signal health problems. Contact a vet if changes last more than a day.",
    category: "WELLNESS",
    isDaily: false
  },
  {
    title: "Create a calm rest area",
    body: "A quiet bed away from heavy foot traffic gives your cat a safe space to relax and recover from stress.",
    category: "WELLNESS",
    isDaily: false
  }
] satisfies Array<{
  title: string;
  body: string;
  category: HealthTipCategory;
  isDaily: boolean;
}>;

export async function seedHealthTips(prisma: PrismaClient) {
  for (const tip of healthTips) {
    const existing = await prisma.healthTip.findFirst({ where: { title: tip.title } });

    if (existing) {
      await prisma.healthTip.update({
        where: { id: existing.id },
        data: tip
      });
    } else {
      await prisma.healthTip.create({ data: tip });
    }
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedHealthTips(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
