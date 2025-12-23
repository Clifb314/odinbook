import React, { useEffect, useState } from "react";
import { getUserIcon } from "../utils/dataAccess";
import PopupReply from "./popupReply";
import { Link } from "react-router-dom";

export default function CommentCard({ comment, findReply, scroll, slideIn }) {
  const [hovering, setHovering] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);


  async function displayIcon(id) {
    const imgBlob = await getUserIcon(id);
    if (imgBlob.err || imgBlob.message) return setImgSrc(null); //error handling
    else return setImgSrc(URL.createObjectURL(imgBlob));
  }

  useEffect(() => {
    if (comment.author.icon) {
      displayIcon(comment.author._id);
    }
  });

  const userIcon = imgSrc ? <img src={imgSrc} className="icon" /> : null;

  //  tiktok/4chan style replying to comments (no nesting)
  //  click to scroll to reply, hover to preview comment
  const replyLine = comment.replyTo ? (
    <div>
      <p
        onMouseOver={() => setHovering(true)}
        onMouseOut={() => setHovering(false)}
        className="replyLine"
      >
        replying to{" "}
        <span onClick={() => scroll(comment.replyTo._id)}>
          {comment.replyTo.author?.username}
        </span>
      </p>
      <PopupReply hovering={hovering} reply={findReply(comment.replyTo._id)} />
    </div>
  ) : (
    null
  );

  return (
    <div className="commentCard">
      {userIcon}
      <p>
        <Link to={`/users/${comment.author._id}`}>
          {comment.author.username}
        </Link>
      </p>
      {replyLine}
      <p>{comment.content}</p>
      <p>Score: {comment.likes.length}</p>
      <p className="timestamp">{new Date(comment.date).toLocaleString()}</p>
    </div>
  );
}
