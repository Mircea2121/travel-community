import {
  getCategoryLabel,
  getLocation,
} from "../utils/postDetailsHelpers";

export default function PostContent({
  post,
}) {
  const location =
    getLocation(post);

  return (
    <>
      {location && (
        <span className="post-details-location">
          {location}
        </span>
      )}

      {post?.category && (
        <span className="post-details-location">
          {getCategoryLabel(
            post.category
          )}
        </span>
      )}

      <h1>{post?.title}</h1>

      {post?.travelPeriod && (
        <p className="post-details-description">
          Perioada călătoriei:{" "}
          <strong>
            {post.travelPeriod}
          </strong>
        </p>
      )}

      <p className="post-details-description">
        {post?.description}
      </p>

      <div className="cost-box">
        <div className="cost-total">
          <span>
            Cost total aproximativ
          </span>

          <strong>
            {post?.totalCost ||
              "Nespecificat"}
          </strong>
        </div>
      </div>

      {post?.tips && (
        <div className="tips-box">
          <h2>Ponturi utile</h2>

          <p>{post.tips}</p>
        </div>
      )}
    </>
  );
}