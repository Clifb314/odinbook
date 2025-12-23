import React, { useEffect, useState } from "react";
import Icons from "../utils/svgHelper";
import {
  createComment,
  createPost,
  editPost,
  editComment,
} from "../utils/dataAccess";
import { useNotis } from "../utils/useToast";
import { Link } from "react-router-dom";
import { useAuth, useAuthContext } from "../utils/useAuth";

export default function PopupForm({ options, toggleOpen }) {
  //  options: type, post, comment
  //  type = reply, comment, post, edit
  //  for reply, commentRef is the comment replying to,
  //  for edit it's the comment being edited
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const {newNoti} = useNotis()
  const {user} = useAuthContext()

  async function handleSubmit() {
    let post = {
      content,
    };
    if (options.type === "post") {
      post.title = title;
    } else if (options.type === "reply") {
      post.replyTo = options.commentRef._id;
    }

    const submitPost = options.type === "post" ? createPost : createComment;
    const submitOptions = options.type === "post" ? null : options.postRef._id
    const response = submitPost(post, submitOptions);
    //if (response.err) slideIn("error", response.err);
    if (response.err) newNoti("error", response.err);
    else {
      //slideIn("success", `${options.type} submitted!`);
      newNoti('success', `${options.type} submitted!`)
      toggleOpen();
    }
  }

  async function handleEdit() {
    let post = {
      content,
    };
    let editID
    if (!options.commentRef) {
      post.title = title;
      editID = options.postRef._id;
    } else {
      //post.replyTo = replying
      editID = options.commentRef._id;
    }

    const submitEdit = !options.commentRef ? editPost : editComment;
    const response = submitEdit(post, editID);
    //if (response.err) slideIn("error", response.err);
    if (response.err) newNoti("error", response.err);

    else {
      //slideIn("success", `${options.type} submitted!`);
      newNoti("success", `${options.type} submitted!`);
    }
  }

  useEffect(() => {
    if (options.type === "edit") {
      if (options.commentRef) {
        setContent(options.commentRef.content);
      } else {
        setTitle(options.postRef.title)
        setContent(options.postRef.content)
      }
      //editing.title ? setTitle(editing.title) : null;
    }
    return () => {
      setContent("");
      setTitle("");
    };
  }, [options]);

  const preview = options.commentRef ? 
    <div className="postCard">     
      <Link to={`/users/${options.commentRef.author._id}`}>
        {options.commentRef.author.username}
      </Link>
      <p>{options.commentRef.content}</p>
    </div>
  : null


  const buttons = options.type === 'edit' ?
    <div className="Btn-container">
      <button
        type="button"
        className="editBtn"
        onClick={handleEdit}
      >
        Edit
      </button>
    </div>
  :
    <div className="Btn-container">
      <button
        type="button"
        className="submitBtn"
        onClick={handleSubmit}
      >
        Send
      </button>
    </div>



  return (
    <div className="form-container">
      <form id="popup-form">
        {preview}
        <div hidden={options.commentRef}>
          <label htmlFor="title">Title: </label>
          <input
            disabled={options.commentRef}
            name="title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <textarea
          value={content}
          placeholder={`Type your ${options.type} here..`}
          id="content"
          name="content"
          onChange={(e) => setContent(e.target.value)}
          maxLength={200}
        />
        {user._id ? buttons : <p className="loginMsg">Must be logged in to post</p>}
      </form>
    </div>
  );
}
