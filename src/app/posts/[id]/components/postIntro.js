import { CalendarDays, Camera, MapPin } from "lucide-react";
import { getCategoryLabel, getLocation, getPostImages } from "../utils/postDetailsHelpers";
export default function PostIntro({post}) {
 const location=getLocation(post); const count=getPostImages(post).length;
 return <div className="post-story-intro"><div className="post-story-kicker"><span>Jurnal de călătorie</span>{post.category && <><i aria-hidden="true" />{getCategoryLabel(post.category)}</>}</div><h1>{post.title}</h1><div className="post-story-meta">{location && <span><MapPin size={15} aria-hidden="true" />{location}</span>}{post.travelPeriod && <span><CalendarDays size={15} aria-hidden="true" />{post.travelPeriod}</span>}{count>0 && <span><Camera size={15} aria-hidden="true" />{count} {count===1?"fotografie":"fotografii"}</span>}</div></div>;
}
