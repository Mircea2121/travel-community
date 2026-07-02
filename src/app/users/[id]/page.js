import UserProfile from "../../components/userProfile/userProfile";
import { getUserById } from "../../services/users";

const demoPosts = [
  {
    id: "1",
    title: "Vacanță în Sardinia",
    description: "Plaje superbe, apă limpede și locuri perfecte pentru relaxare.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    likes: 124,
    commentsCount: 18,
    cost: "850€",
  },
  {
    id: "2",
    title: "City break în Roma",
    description: "Un oraș plin de istorie, mâncare bună și atmosferă italiană.",
    image: "https://images.unsplash.com/photo-1529260830199-42c24126f198",
    likes: 89,
    commentsCount: 11,
    cost: "520€",
  },
  {
    id: "3",
    title: "Aventură în Barcelona",
    description: "Plajă, arhitectură, mâncare bună și multă energie.",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded",
    likes: 156,
    commentsCount: 24,
    cost: "690€",
  },
];

export default async function UserPage({ params }) {
  const user = await getUserById(params.id);

  const userPosts = demoPosts.filter((post) => user?.posts?.includes(post.id));

  return (
    <UserProfile
      user={user}
      userPosts={userPosts}
      savedPosts={[]}
      isOwnProfile={false}
      isFollowing={false}
    />
  );
}