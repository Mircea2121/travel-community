import { calculateUserLevel, getNextUserLevel } from "../utils/levels";

const users = [
  {
    id: "1",

    username: "Mircea",

    fullName: "Mircea Chiriță",

    avatar: "https://i.pravatar.cc/300?img=12",

    coverImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",

    bio: "Îmi place să călătoresc și să descopăr locuri noi prin Europa.",

    country: "România",

    city: "București",

    joinedAt: "2025-01-12",

    favoriteDestination: "Sardinia",

    activityStreak: 15,

    photosUploaded: 84,

    badges: [
      "Primii 100 membri",
      "10 destinații vizitate",
      "1000+ aprecieri",
    ],

    socialLinks: {
      instagram: "",
      facebook: "",
      website: "",
    },

    stats: {
      postsCount: 12,
      destinationsCount: 18,
      likesReceived: 354,
      commentsCount: 91,
      followers: 248,
      following: 96,
    },

    posts: ["1", "2", "3"],

    savedPosts: ["5", "8"],
  },
];

export const demoUsers = users.map((user) => ({
  ...user,
  level: calculateUserLevel(user.stats),
  nextLevel: getNextUserLevel(user.stats),
}));