import {
  Bell,
  Bookmark,
  Brush,
  Hospital,
  PawPrint,
  ShieldPlus,
  Stethoscope,
  Syringe,
  Utensils,
  Users
} from "lucide-react";
import eventIcon from "../../images/eventIcon.png";
import storiesIcon from "../../images/storiesIcon.png";
import tipIcon from "../../images/tipIcon.png";
import vetIcon from "../../images/vetIcon.png";

export const currentUser = {
  name: "WhiskersMom",
  role: "Cat Lover",
  avatar:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  catAvatar:
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=500&q=80",
  stats: {
    posts: 128,
    followers: 356,
    following: 278
  }
};

export const cats = [
  {
    id: "luna",
    name: "Luna",
    gender: "Female",
    breed: "Persian",
    age: "2 years",
    distance: "1.2 km away",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
    about:
      "Hi! I am Luna. I love naps, calm people, sunny windows, and chicken treats.",
    personality: ["Calm", "Friendly", "Shy"],
    lookingFor: ["Playmate", "Cat Friends"]
  },
  {
    id: "milo",
    name: "Milo",
    gender: "Male",
    breed: "British Shorthair",
    age: "3 years",
    distance: "800 m away",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
    about: "Milo is a curious window watcher who is always ready for gentle play.",
    personality: ["Curious", "Social", "Gentle"],
    lookingFor: ["Walk Buddy", "Playdate"]
  },
  {
    id: "simba",
    name: "Simba",
    gender: "Male",
    breed: "Maine Coon",
    age: "1 year",
    distance: "2.1 km away",
    image:
      "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=900&q=80",
    about: "A fluffy explorer with a big purr and bigger snack ambitions.",
    personality: ["Playful", "Brave", "Cuddly"],
    lookingFor: ["Events", "Cat Friends"]
  },
  {
    id: "nala",
    name: "Nala",
    gender: "Female",
    breed: "Ragdoll",
    age: "4 years",
    distance: "1.8 km away",
    image:
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=900&q=80",
    about: "Nala loves gentle brushing, quiet rooms, and new soft blankets.",
    personality: ["Sweet", "Relaxed", "Loyal"],
    lookingFor: ["Cat Friends", "Playdate"]
  }
];

export const quickActions = [
  {
    title: "Health Tips",
    href: "/health",
    icon: tipIcon.src,
    color: "bg-paw-butter"
  },
  {
    title: "Stories & Memes",
    href: "/stories",
    icon: storiesIcon.src,
    color: "bg-paw-blush"
  },
  {
    title: "Vet Directory",
    href: "/vets",
    icon: vetIcon.src,
    color: "bg-paw-lilac"
  },
  {
    title: "Events",
    href: "/events",
    icon: eventIcon.src,
    color: "bg-[#FFE0C5]"
  }
];

export const events = [
  {
    id: "cat-cafe",
    title: "Cat Cafe Meet & Greet",
    date: "Sun, May 25 - 11:00 AM",
    place: "Purrista Cat Cafe, Downtown",
    distance: "1.2 km",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "adoption-drive",
    title: "Kitten Adoption Drive",
    date: "Sat, May 31 - 2:00 PM",
    place: "Happy Paws Shelter",
    distance: "2.4 km",
    image:
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "care-workshop",
    title: "Cat Care Workshop",
    date: "Sun, Jun 8 - 10:30 AM",
    place: "PawPals Community Center",
    distance: "3.1 km",
    image:
      "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "adventure-walk",
    title: "Outdoor Adventure Walk",
    date: "Sat, Jun 14 - 7:30 AM",
    place: "Green Paws Park",
    distance: "3.8 km",
    image:
      "https://images.unsplash.com/photo-1501820488136-72669149e0d4?auto=format&fit=crop&w=500&q=80"
  }
];

export const healthTipCategories = [
  {
    title: "Healthy Nutrition",
    description: "Learn what foods are safe and healthy for your cat.",
    icon: Utensils,
    color: "bg-[#DFF4C7] text-emerald-600"
  },
  {
    title: "Grooming Essentials",
    description: "Tips for brushing, bathing, and keeping your cat clean.",
    icon: Brush,
    color: "bg-paw-lilac text-paw-lavender"
  },
  {
    title: "Understanding Behavior",
    description: "Decode your cat's body language and behaviors.",
    icon: PawPrint,
    color: "bg-paw-blush text-paw-pink"
  },
  {
    title: "Preventive Care",
    description: "Vaccinations, regular checkups, and parasite prevention.",
    icon: Hospital,
    color: "bg-[#DDECFF] text-blue-600"
  }
];

export const posts = [
  {
    id: "post-1",
    user: "PawMommy",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    time: "3h ago",
    text: "How do you keep your cat hydrated in summer? Luna only accepts the royal fountain.",
    image:
      "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?auto=format&fit=crop&w=900&q=80",
    likes: 12,
    comments: 5
  },
  {
    id: "post-2",
    user: "CatDad",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    time: "5h ago",
    text: "My chunky boy enjoying his box castle.",
    image:
      "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=900&q=80",
    likes: 31,
    comments: 9
  },
  {
    id: "post-3",
    user: "MeowMemes",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=300&q=80",
    time: "2h ago",
    text: "I do not need therapy. I need treats.",
    image:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80",
    likes: 25,
    comments: 7
  }
];

export const stories = [
  {
    id: "story-1",
    name: "Luna",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "story-2",
    name: "Milo",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "story-3",
    name: "Simba",
    image:
      "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "story-4",
    name: "Nala",
    image:
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=300&q=80"
  }
];

export const vets = [
  {
    id: "paws-claws",
    name: "Paws & Claws Vet Clinic",
    distance: "0.8 km away",
    rating: "4.8",
    reviews: 120,
    status: "Open",
    closes: "Closes 8 PM",
    image:
      "https://images.unsplash.com/photo-1576765607924-6f0b04cf8f6d?auto=format&fit=crop&w=900&q=80",
    about:
      "Compassionate care for your furry family members, from everyday checkups to urgent support.",
    services: [
      { label: "Checkup", icon: Stethoscope },
      { label: "Vaccination", icon: Syringe },
      { label: "Dental", icon: ShieldPlus },
      { label: "Surgery", icon: Hospital }
    ]
  },
  {
    id: "meowcare",
    name: "MeowCare Veterinary",
    distance: "1.3 km away",
    rating: "4.7",
    reviews: 98,
    status: "Open",
    closes: "Closes 7 PM",
    image:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80",
    about: "Friendly neighborhood clinic for preventive care and nutrition advice.",
    services: [
      { label: "Checkup", icon: Stethoscope },
      { label: "Food", icon: Utensils },
      { label: "Vaccines", icon: Syringe }
    ]
  },
  {
    id: "happy-tails",
    name: "Happy Tails Animal Hospital",
    distance: "2.1 km away",
    rating: "4.6",
    reviews: 76,
    status: "Open",
    closes: "Closes 9 PM",
    image:
      "https://images.unsplash.com/photo-1584797345215-5fc2f911e1bc?auto=format&fit=crop&w=900&q=80",
    about: "Full service pet hospital with extended evening care.",
    services: [
      { label: "Emergency", icon: Hospital },
      { label: "Checkup", icon: Stethoscope },
      { label: "Dental", icon: ShieldPlus }
    ]
  }
];

export const chatMessages = [
  {
    id: "chat-1",
    from: "them",
    text: "Hi! Luna looks so cute.",
    time: "10:30 AM"
  },
  {
    id: "chat-2",
    from: "me",
    text: "Thank you! She is very friendly with other cats too.",
    time: "10:32 AM"
  },
  {
    id: "chat-3",
    from: "them",
    text: "Would you like to set up a playdate sometime?",
    time: "10:33 AM"
  },
  {
    id: "chat-4",
    from: "me",
    text: "Yes! That would be purrfect.",
    time: "10:35 AM"
  }
];

export const profileMenu = [
  { label: "My PawPals", icon: Users },
  { label: "Saved Posts", icon: Bookmark },
  { label: "My Vet Visits", icon: Hospital },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: PawPrint }
];
