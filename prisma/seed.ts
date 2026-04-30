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
      latitude: 40.7306,
      longitude: -73.9352,
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
      latitude: 40.7128,
      longitude: -74.006,
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

  const [vet] = await Promise.all([
    prisma.vet.create({
      data: {
        name: "Animal Medical Centre",
        description: "Referral veterinary hospital at Wisma Medivet, Kuala Lumpur, with consultation and 24-hour emergency support.",
        imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
        address: "Wisma Medivet, 8, Jln Tun Razak, 50400 Kuala Lumpur",
        city: "Kuala Lumpur",
        latitude: 3.1715,
        longitude: 101.7007,
        rating: 4.8,
        isOpen: true,
        openHours: "Consultation 9 AM-9 PM, 24-hour emergency",
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
    }),
    prisma.vet.create({
      data: {
        name: "Gasing Veterinary Hospital",
        description: "Veterinary hospital in Gasing Indah, Petaling Jaya, offering small animal care.",
        imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
        address: "53 & 55, Jalan 5/58, Gasing Indah, 46000 Petaling Jaya, Selangor",
        city: "Petaling Jaya",
        latitude: 3.08733,
        longitude: 101.6629,
        rating: 4.7,
        isOpen: true,
        openHours: "Mon-Sat 10 AM-8 PM, Sun 10 AM-6 PM",
        services: {
          create: [
            { type: "CHECKUP" },
            { type: "VACCINATION" },
            { type: "SURGERY" },
            { type: "DENTAL" }
          ]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Vets for Pets Animal Clinic Kuchai Lama",
        description: "Full-service small animal and exotic veterinary clinic in Kuchai Lama, Kuala Lumpur.",
        imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
        address: "No. 49, Jalan Kuchai Lama, Taman Lian Hoe, 58100 Kuala Lumpur",
        city: "Kuala Lumpur",
        latitude: 3.0906,
        longitude: 101.6894,
        rating: 4.6,
        isOpen: true,
        openHours: "Mon-Fri 10 AM-7 PM, Sat-Sun 10 AM-3 PM",
        services: {
          create: [
            { type: "CHECKUP" },
            { type: "VACCINATION" },
            { type: "DENTAL" },
            { type: "SURGERY" }
          ]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Vets for Pets Animal Clinic Solaris Mont Kiara",
        description: "VPAC branch in Solaris Mont Kiara providing appointment-based veterinary care.",
        imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
        address: "No. 5, Jalan Solaris 4, Solaris Mont Kiara, 50480 Kuala Lumpur",
        city: "Kuala Lumpur",
        latitude: 3.1746,
        longitude: 101.6507,
        rating: 4.6,
        isOpen: true,
        openHours: "Appointment recommended",
        services: {
          create: [
            { type: "CHECKUP" },
            { type: "VACCINATION" },
            { type: "DENTAL" },
            { type: "SURGERY" }
          ]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Healing Rooms Veterinary Clinic",
        description: "Subang Jaya veterinary clinic at SS14 offering consultations, vaccinations, surgery, and pet health care.",
        imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
        address: "98, Jalan SS 14/1, SS14, 47500 Subang Jaya, Selangor",
        city: "Subang Jaya",
        latitude: 3.0791,
        longitude: 101.5804,
        rating: 4.4,
        isOpen: true,
        openHours: "Mon-Fri 10 AM-7 PM, Sat 10 AM-6 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Shah Alam Veterinary Clinic",
        description: "Veterinary clinic in Seksyen 13, Shah Alam, serving pets with checkups, vaccination, and treatment.",
        imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
        address: "63-G, Jalan Snuker 13/28, Tadisma Business Centre, Seksyen 13, 40100 Shah Alam, Selangor",
        city: "Shah Alam",
        latitude: 3.0829,
        longitude: 101.5476,
        rating: 4.5,
        isOpen: true,
        openHours: "Mon-Fri 11 AM-9 PM, Sat 10 AM-8 PM, Sun 11 AM-4 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }, { type: "EMERGENCY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Serv-U Veterinary Clinic & Surgery",
        description: "Kota Kemuning veterinary clinic and surgery in Shah Alam.",
        imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
        address: "32, Jalan Anggerik Vanilla BE 31/BE, Kota Kemuning, 40460 Shah Alam, Selangor",
        city: "Shah Alam",
        latitude: 3.0015,
        longitude: 101.539,
        rating: 4.5,
        isOpen: true,
        openHours: "Call clinic for current hours",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Klang Veterinary Clinic & Surgery",
        description: "Veterinary clinic and surgery in Klang with extended emergency-style availability.",
        imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
        address: "20, Lorong Kasawari 4, 41150 Klang, Selangor",
        city: "Klang",
        latitude: 3.0528,
        longitude: 101.4498,
        rating: 4.4,
        isOpen: true,
        openHours: "Mon-Fri and Sun 24 hours, closed Sat",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }, { type: "EMERGENCY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Kitty's Care Veterinary Clinic Putrajaya",
        description: "Putrajaya veterinary clinic in Presint 8 focused on cat and pet care.",
        imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
        address: "No. 18, Jalan P8G1, Presint 8, 62250 Putrajaya",
        city: "Putrajaya",
        latitude: 2.9264,
        longitude: 101.6818,
        rating: 4.8,
        isOpen: true,
        openHours: "Tue-Fri 10:30 AM-8:30 PM, Sat-Sun 10:30 AM-3:30 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Jhan Veterinary Clinic Putrajaya",
        description: "Veterinary clinic in Presint 15, Putrajaya.",
        imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
        address: "No. 2, Jalan P15H, Presint 15, Pusat Perdagangan Greenpark, 62050 Putrajaya",
        city: "Putrajaya",
        latitude: 2.9431,
        longitude: 101.723,
        rating: 4.6,
        isOpen: true,
        openHours: "Open until 9 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Klinik Veterinar Family",
        description: "Veterinary clinic in Bandar Baru Uda, Johor Bahru.",
        imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
        address: "42, Jalan Padi Emas 2, Bandar Baru Uda, 81200 Johor Bahru, Johor",
        city: "Johor Bahru",
        latitude: 1.4953,
        longitude: 103.7058,
        rating: 4.5,
        isOpen: true,
        openHours: "Open until 7 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Pawsitive Veterinary Clinic",
        description: "Veterinary clinic in Iskandar Puteri, Johor Bahru.",
        imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
        address: "175, Jalan Sentral 24, Iskandar Puteri, 79100 Johor Bahru, Johor",
        city: "Johor Bahru",
        latitude: 1.4292,
        longitude: 103.6305,
        rating: 4.6,
        isOpen: true,
        openHours: "Daily 10 AM-6 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Gill's Veterinary Clinic",
        description: "Penang veterinary hospital on Jalan Bagan Jermal with emergency contact support.",
        imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
        address: "10-A, Jalan Bagan Jermal, 10250 Penang",
        city: "Penang",
        latitude: 5.4331,
        longitude: 100.3125,
        rating: 4.6,
        isOpen: true,
        openHours: "Mon-Sat 9 AM-12 PM, 2-5 PM, 8-9:30 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }, { type: "EMERGENCY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Pava's Animal Clinic",
        description: "Animal clinic in Bukit Gelugor, Penang.",
        imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
        address: "201, Jalan Utara, Bukit Gelugor, 11700 Gelugor, Pulau Pinang",
        city: "Penang",
        latitude: 5.3736,
        longitude: 100.3043,
        rating: 4.4,
        isOpen: true,
        openHours: "Call clinic for current hours",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Klinik Haiwan Mano",
        description: "Veterinary clinic in Taman Pertama, Ipoh.",
        imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
        address: "62, Jalan Ng Weng Hup, Taman Pertama, 30010 Ipoh, Perak",
        city: "Ipoh",
        latitude: 4.6243,
        longitude: 101.0777,
        rating: 4.5,
        isOpen: true,
        openHours: "Mon-Fri 10:30 AM-7 PM, Sat 10:30 AM-6 PM",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    }),
    prisma.vet.create({
      data: {
        name: "Dr.K Veterinary Clinic & Surgery",
        description: "Veterinary clinic and surgery in Bandar Baru Medan Ipoh.",
        imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
        address: "17, Jalan Medan Ipoh 8, Bandar Baru Medan Ipoh, 31400 Ipoh, Perak",
        city: "Ipoh",
        latitude: 4.6256,
        longitude: 101.1172,
        rating: 4.4,
        isOpen: true,
        openHours: "Thu-Tue varied hours, closed Wed",
        services: {
          create: [{ type: "CHECKUP" }, { type: "VACCINATION" }, { type: "SURGERY" }]
        }
      }
    })
  ]);
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
