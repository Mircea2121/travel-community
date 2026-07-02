import UserProfile from "../components/userProfile/userProfile";
import { getCurrentUser } from "../services/users";

const demoPosts = [
  {
    id: "1",
    title: "Vacanță în Sardinia",
    description:
      "Plaje superbe, apă limpede și locuri perfecte pentru relaxare.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    likes: 124,
    commentsCount: 18,
    cost: "850€",
  },
  {
    id: "2",
    title: "City break în Roma",
    description:
      "Un oraș plin de istorie, mâncare bună și atmosferă italiană.",
    image:
      "https://images.unsplash.com/photo-1529260830199-42c24126f198",
    likes: 89,
    commentsCount: 11,
    cost: "520€",
  },
  {
    id: "3",
    title: "Aventură în Barcelona",
    description:
      "Plajă, arhitectură, mâncare bună și multă energie.",
    image:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded",
    likes: 156,
    commentsCount: 24,
    cost: "690€",
  },
  {
    id: "5",
    title: "Apus în Santorini",
    description:
      "Una dintre cele mai frumoase experiențe de vacanță.",
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff",
    likes: 210,
    commentsCount: 32,
    cost: "980€",
  },
  {
    id: "8",
    title: "Weekend în Viena",
    description:
      "Oraș elegant, curat și perfect pentru un city break.",
    image:
      "https://images.unsplash.com/photo-1516550893923-42d28e5677af",
    likes: 97,
    commentsCount: 9,
    cost: "430€",
  },
];

export default async function ProfilePage() {
  const user = await getCurrentUser();

  const userPosts = demoPosts.filter((post) =>
    user?.posts?.includes(post.id)
  );

  const savedPosts = demoPosts.filter((post) =>
    user?.savedPosts?.includes(post.id)
  );

  return (
    <UserProfile
      user={user}
      userPosts={userPosts}
      savedPosts={savedPosts}
      isOwnProfile={true}
      isFollowing={false}
    />
  );
}