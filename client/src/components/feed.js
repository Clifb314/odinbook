import React, { useEffect, useState } from "react";
import { postList, getUserIcon } from "../utils/dataAccess";
import PostCard from "./postCard";
import PopupForm from "./popupForm";
import { useParams } from "react-router-dom";
import { useNotis } from "../utils/useToast";
import Icons from "../utils/svgHelper";

export default function Feed() {


  const replyTemplate = {
    type: "post", //post, reply, comment, edit, post is default
    postRef: null, //replying to a post (or comment), or editing a post
    commentRef: null, //if replying to a comment or editing a comment
  };
  const [PopUpOpts, setPopupOpts] = useState(replyTemplate);
  const [openPopUp, setOpenPopUp] = useState(null);
  const [posts, setPosts] = useState([]);
  const sorting = useParams().sorting;
  const {newNoti} = useNotis()


    async function getPosts() {
      const query = sorting ? sorting : 'top'
      const response = await postList(query);
      if (response.err) newNoti('error', response.err)
      else {
        setPosts(response)
        newNoti('success', 'Feed updated')
      }
    }
  
  
    useEffect(() => {
      getPosts();
  
      return () => setPosts([]);
    }, [sorting]);

    



  /* New Post Button */
  function togglePopUp(keepOpen = false) {
    if (openPopUp) {
      setOpenPopUp(false);
      setPopupOpts(replyTemplate);
    } else {
      setOpenPopUp(true);
    }
  }

  function populatePopUp(type, postRef, commentRef, commentPreview) {
    setPopupOpts({ type, postRef, commentRef, commentPreview });
    togglePopUp(true);
  }

  const floatBtn = openPopUp ? (
    <div className="popup open">
      <div className="closeBtn" onClick={togglePopUp}>
        <Icons iconName={'close'} />
      </div>
      <PopupForm
        options={PopUpOpts}
        toggleOpen={togglePopUp}
      />
    </div>
  ) : (
    <div className={openPopUp === null ? 'popup initial' : 'popup closed'} onClick={togglePopUp}>
      <Icons iconName={'openNew'} />
    </div>
  );


  /* Render Posts */
  const display =
    posts.length > 0 ? (
        posts.map((post) => {
          return (
            <div key={post._id}>
              <PostCard
                post={post}
                populateReply={populatePopUp}
              />
            </div>
          );
        })
    ) : (
      <p>Feed is empty..</p>
    );

  return (
    <div className="feed">
      {display}
      {floatBtn}
    </div>
  );
}
