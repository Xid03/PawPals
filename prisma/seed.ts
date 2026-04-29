import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.savedHealthTip.deleteMany();
  await prisma.healthTip.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.eventRSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.favoriteVet.deleteMany();
  await prisma.vetService.deleteMany();
  await prisma.vet.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.storyLike.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.catPhoto.deleteMany();
  await prisma.catProfile.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("password123", 12);
  const [maya, noah, lina] = await Promise.all([
    prisma.user.create({
      data: {
        email: "maya@pawpals.test",
        username: "whiskersmom",
        name: "Maya",
        city: "New York",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        email: "noah@pawpals.test",
        username: "catdad",
        name: "Noah",
        city: "New York",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        email: "lina@pawpals.test",
        username: "pawtails",
        name: "Lina",
        city: "Brooklyn",
        passwordHash
      }
    })
  ]);

  const luna = await prisma.catProfile.create({
    data: {
      ownerId: maya.id,
      name: "Luna",
      ageMonths: 24,
      gender: "FEMALE",
      breed: "Persian",
      personalityTags: ["Calm", "Friendly", "Shy"],
      lookingFor: ["Playmate", "Cat Friends"],
      city: "New York",
      description: "Loves naps, calm people, and chicken treats.",
      photos: {
        create: {
          url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80"
        }
      }
    }
  });

  const milo = await prisma.catProfile.create({
    data: {
      ownerId: noah.id,
      name: "Milo",
      ageMonths: 36,
      gender: "MALE",
      breed: "British Shorthair",
      personalityTags: ["Curious", "Social", "Gentle"],
      lookingFor: ["Walk Buddy", "Playdate"],
      city: "New York",
      description: "Window watcher and gentle playdate expert.",
      photos: {
        create: {
          url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80"
        }
      }
    }
  });

  await prisma.follow.create({ data: { followerId: maya.id, followingId: noah.id } });
  await prisma.swipe.create({ data: { userId: maya.id, catId: milo.id, action: "LIKE" } });
  await prisma.swipe.create({ data: { userId: noah.id, catId: luna.id, action: "LIKE" } });
  const [userAId, userBId] = [maya.id, noah.id].sort();
  await prisma.match.create({ data: { userAId, userBId } });

  const post = await prisma.post.create({
    data: {
      authorId: maya.id,
      text: "How do you keep your cat hydrated in summer?",
      topic: "HEALTH",
      images: {
        create: {
          url: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?auto=format&fit=crop&w=900&q=80"
        }
      }
    }
  });
  await prisma.like.create({ data: { postId: post.id, userId: noah.id } });
  await prisma.comment.create({ data: { postId: post.id, authorId: noah.id, text: "A fountain helped Milo a lot." } });

  await prisma.story.create({
    data: {
      authorId: noah.id,
      url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80",
      caption: "Treat negotiations continue.",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  const conversation = await prisma.conversation.create({
    data: {
      participants: { create: [{ userId: maya.id }, { userId: noah.id }] },
      messages: {
        create: [
          { senderId: noah.id, body: "Hi! Luna looks so cute." },
          { senderId: maya.id, body: "Thank you! She is friendly with other cats too." }
        ]
      }
    }
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  const vet = await prisma.vet.create({
    data: {
      name: "Paws & Claws Vet Clinic",
      description: "Compassionate care for your furry family members.",
      imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
      address: "12 Catnip Ave",
      city: "New York",
      rating: 4.8,
      isOpen: true,
      openHours: "Open - Closes 8 PM",
      services: {
        create: [
          { type: "CHECKUP" },
          { type: "VACCINATION" },
          { type: "DENTAL" },
          { type: "SURGERY" },
          { type: "EMERGENCY" }
        ]
      }
    }
  });
  await prisma.favoriteVet.create({ data: { vetId: vet.id, userId: maya.id } });

  await prisma.event.createMany({
    data: [
      {
        organizerId: lina.id,
        title: "Cat Cafe Meet & Greet",
        description: "A relaxed social morning for cat owners.",
        category: "MEETUPS",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: "Purrista Cat Cafe, Downtown",
        city: "New York"
      },
      {
        organizerId: noah.id,
        title: "Kitten Adoption Drive",
        description: "Meet adoptable kittens and local shelters.",
        category: "ADOPTION",
        startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: "Happy Paws Shelter",
        city: "New York"
      }
    ]
  });

  await prisma.healthTip.createMany({
    data: [
      {
        title: "Keep your cat hydrated",
        body: "Fresh water helps support healthy kidneys and digestion.",
        category: "NUTRITION",
        isDaily: true
      },
      {
        title: "Brush gently and often",
        body: "Short grooming sessions help reduce stress and matting.",
        category: "GROOMING"
      },
      {
        title: "Understand slow blinking",
        body: "Slow blinking can be a relaxed social signal from your cat.",
        category: "BEHAVIOR"
      }
    ]
  });

  await prisma.appointment.create({
    data: {
      userId: maya.id,
      vetId: vet.id,
      catId: luna.id,
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reason: "Annual checkup"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
