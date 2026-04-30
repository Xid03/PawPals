import { PrismaClient, type VetServiceType } from "@prisma/client";

export const malaysiaVets = [
  {
    currentName: "Paws & Claws Vet Clinic",
    name: "Animal Medical Centre",
    description:
      "Referral veterinary hospital at Wisma Medivet, Kuala Lumpur, with consultation and 24-hour emergency support.",
    imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    address: "Wisma Medivet, 8, Jln Tun Razak, 50400 Kuala Lumpur",
    city: "Kuala Lumpur",
    latitude: 3.1715,
    longitude: 101.7007,
    rating: 4.8,
    isOpen: true,
    openHours: "Consultation 9 AM-9 PM, 24-hour emergency",
    services: ["CHECKUP", "VACCINATION", "DENTAL", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY", "DENTAL"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "DENTAL", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "DENTAL", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
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
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Klinik Haiwan & Surgeri AOR",
    description: "Alor Setar veterinary clinic and surgery in Kompleks Perniagaan Sultan Abdul Hamid.",
    imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
    address: "No 96, Kompleks Perniagaan Sultan Abdul Hamid, Persiaran Sultan Abdul Hamid, 05050 Alor Setar, Kedah",
    city: "Alor Setar",
    latitude: 6.1168,
    longitude: 100.368,
    rating: 4.0,
    isOpen: true,
    openHours: "Mon-Wed 10 AM-8 PM, Thu 10 AM-6 PM, Sat 10 AM-8 PM, Sun 10 AM-6 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Klinik Haiwan & Surgeri Darul Aman",
    description: "Veterinary clinic and surgery in Mergong Jaya, Alor Setar.",
    imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    address: "Ground Floor, 255, Jalan Inang 4, Taman Sri Inang, Mergong Jaya, 05150 Alor Setar, Kedah",
    city: "Alor Setar",
    latitude: 6.1515,
    longitude: 100.3703,
    rating: 4.5,
    isOpen: true,
    openHours: "Daily 10 AM-7:30 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "SANCTUARY Veterinary Clinic",
    description: "Veterinary clinic in Kangar Jaya, Perlis.",
    imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
    address: "10, Jalan Kangar Jaya 2, Kangar Jaya, 01000 Kangar, Perlis",
    city: "Kangar",
    latitude: 6.4414,
    longitude: 100.1986,
    rating: 4.3,
    isOpen: true,
    openHours: "Mon-Thu, Sat-Sun 10 AM-7 PM, closed Fri",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "V Care Animal Clinic",
    description: "Veterinary clinic in Kampung Dusun Muda, Kota Bharu.",
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
    address: "Lot 4634, Jalan Dusun Muda, Kampung Dusun Muda, 15200 Kota Bharu, Kelantan",
    city: "Kota Bharu",
    latitude: 6.1166,
    longitude: 102.2386,
    rating: 4.6,
    isOpen: true,
    openHours: "Daily 9 AM-10:30 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "DrNor Veterinary Clinic",
    description: "Veterinary clinic in Kampung Gong Kapas, Kuala Terengganu.",
    imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
    address: "239, Lorong Pasar, Kampung Gong Kapas, 21100 Kuala Terengganu, Terengganu",
    city: "Kuala Terengganu",
    latitude: 5.3297,
    longitude: 103.1396,
    rating: 4.4,
    isOpen: true,
    openHours: "Wed-Thu, Sat-Sun split sessions, Fri night session, closed Mon-Tue",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Pet Alley Animal Clinic",
    description: "Kuala Terengganu clinic offering consultation, boarding, neutering, and vaccination services.",
    imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    address: "102-H, Jalan Hiliran, 20300 Kuala Terengganu, Terengganu",
    city: "Kuala Terengganu",
    latitude: 5.3239,
    longitude: 103.1412,
    rating: 4.5,
    isOpen: true,
    openHours: "Sun-Thu 10 AM-6 PM, closed Fri",
    services: ["CHECKUP", "VACCINATION", "DENTAL", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Klinik Veterinar Vetcare RP",
    description: "Veterinary clinic in Taman Jade, Kuantan.",
    imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
    address: "A243, Jalan Dato' Wong Ah Jang, Taman Jade, 25100 Kuantan, Pahang",
    city: "Kuantan",
    latitude: 3.8077,
    longitude: 103.326,
    rating: 4.5,
    isOpen: true,
    openHours: "Tue-Sun 10 AM-7 PM, closed Mon",
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
    name: "Jawhari Wellness Veterinary Clinic",
    description: "Wellness veterinary clinic in Taman Pandan Damai, Kuantan.",
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
    address: "B20, Lorong Pandan Damai 2/4, Taman Pandan Damai, 25150 Kuantan, Pahang",
    city: "Kuantan",
    latitude: 3.7797,
    longitude: 103.2839,
    rating: 4.4,
    isOpen: true,
    openHours: "Daily 10 AM-6 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "I Care Veterinary Clinic",
    description: "Veterinary clinic in Taman IKS Merdeka, Melaka.",
    imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
    address: "26, Jalan IKS M5, Taman IKS Merdeka, 75350 Melaka",
    city: "Melaka",
    latitude: 2.2667,
    longitude: 102.2405,
    rating: 4.5,
    isOpen: true,
    openHours: "Open until 6:30 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Animalia Veterinary Clinic",
    description: "Veterinary clinic in Bandar Sri Sendayan, Seremban.",
    imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    address: "Metro Sendayan, 211, Jalan Metro Sendayan 2/3, Bandar Sri Sendayan, 71950 Seremban, Negeri Sembilan",
    city: "Seremban",
    latitude: 2.6934,
    longitude: 101.8702,
    rating: 4.6,
    isOpen: true,
    openHours: "Varied daily sessions, evening slots available",
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
    name: "Kinabalu Animal Clinic",
    description: "Animal clinic in Kolombong, Kota Kinabalu.",
    imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
    address: "Lot 6, Lorong Durian 3, Kian Yap Industrial Estate, Kolombong, Inanam, 88450 Kota Kinabalu, Sabah",
    city: "Kota Kinabalu",
    latitude: 5.9975,
    longitude: 116.114,
    rating: 4.6,
    isOpen: true,
    openHours: "Mon-Sat 8:30 AM-12:30 PM, 2 PM-6 PM, closed Sun",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "BDC Veterinary Clinic",
    description: "Kota Kinabalu veterinary clinic in Inanam.",
    imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",
    address: "No. 2 Wei Hing Light Industrial Centre, Jalan Kilang, Jalan Kolombong, Inanam, 88450 Kota Kinabalu, Sabah",
    city: "Kota Kinabalu",
    latitude: 5.997,
    longitude: 116.117,
    rating: 4.4,
    isOpen: true,
    openHours: "Daily 9:30 AM-12:30 PM, 1:30 PM-5:30 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Animal Central Veterinary Clinic",
    description: "Kuching veterinary clinic on Jalan Tabuan.",
    imageUrl: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
    address: "70, Jalan Tabuan, 93100 Kuching, Sarawak",
    city: "Kuching",
    latitude: 1.547,
    longitude: 110.352,
    rating: 4.4,
    isOpen: true,
    openHours: "Daily 9 AM-9 PM",
    services: ["CHECKUP", "VACCINATION", "SURGERY", "EMERGENCY"] satisfies VetServiceType[]
  },
  {
    name: "Ting & Lu Veterinary Center",
    description: "Veterinary center on Westine Avenue, Kuching.",
    imageUrl: "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    address: "No. 87 Lot 11879 SL 12, Westine Avenue, 801-2B Jalan Tun Jugah, 93350 Kuching, Sarawak",
    city: "Kuching",
    latitude: 1.5145,
    longitude: 110.3565,
    rating: 4.5,
    isOpen: true,
    openHours: "Mon-Sat 9:30 AM-12:30 PM, 2 PM-5 PM, closed Sun",
    services: ["CHECKUP", "VACCINATION", "SURGERY"] satisfies VetServiceType[]
  },
  {
    name: "Jabatan Perkhidmatan Veterinar Labuan",
    description: "Government veterinary clinic service in Labuan.",
    imageUrl: "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
    address: "700, 87000 Labuan",
    city: "Labuan",
    latitude: 5.2831,
    longitude: 115.2308,
    rating: 4.2,
    isOpen: true,
    openHours: "Mon-Fri 8:30 AM-12 PM, 2 PM-4 PM, closed weekends",
    services: ["CHECKUP", "VACCINATION"] satisfies VetServiceType[]
  }
];

async function upsertServices(prisma: PrismaClient, vetId: string, services: VetServiceType[]) {
  await Promise.all(
    services.map((type) =>
      prisma.vetService.upsert({
        where: { vetId_type: { vetId, type } },
        create: { vetId, type },
        update: {}
      })
    )
  );
}

export async function seedMalaysiaVets(prisma: PrismaClient) {
  for (const vetData of malaysiaVets) {
    const existing = await prisma.vet.findFirst({
      where: { OR: [{ name: vetData.name }, ...(vetData.currentName ? [{ name: vetData.currentName }] : [])] }
    });
    const { currentName: _currentName, services, ...data } = vetData;
    const vet = existing
      ? await prisma.vet.update({ where: { id: existing.id }, data })
      : await prisma.vet.create({ data });
    await upsertServices(prisma, vet.id, services);
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedMalaysiaVets(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
