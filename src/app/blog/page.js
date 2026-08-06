import BlogClient from "../components/blog/blogClient";
import "./blog.css";

export const metadata = {
  title: "Blog de călătorie | Comunitatea Călătorilor",
  description:
    "Descoperă experiențele comunității și postările călătorilor pe care îi urmărești.",
};

export default function BlogPage() {
  return <BlogClient />;
}
