import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendInbox, inboxDetail } from "../utils/dataAccess";
import { useAuthContext } from "../utils/useAuth";
import { useNotis } from "../utils/useToast";
import Icons from "../utils/svgHelper";

export default function InboxReply({ openMsg, updateList, refreshList }) {
  const [reply, setReply] = useState("");
  const [chain, setChain] = useState([
    { to: { _id: null }, from: { _id: null } },
  ]);
  const [title, setTitle] = useState("");
  //const [checkNew, setCheckNew] = useState(false)

  const { user } = useAuthContext();
  const { newNoti } = useNotis();

  async function getChain() {
    if (!openMsg) return;
    else if (openMsg.new) {
      const newMsg = {
        _id: 1,
        to: openMsg.to, //expecting an obj w/ username and _id
        from: user._id,
        content: "Type your first message below!",
        date: null,
      };
      setChain([newMsg]);
      return;
    }

    const response = await inboxDetail(openMsg._id);
    if (response.err) return response.err; //error handling
    setChain(response);
  }

  function refreshBtn() {
    getChain();
    refreshList();
  }

  useEffect(() => {
    getChain();

    return () => setChain([]);
  }, [openMsg]);

  const displayChain =
    chain.length > 0 && chain[0].to ? (
      chain.map((msg) => {
        if (!msg) return;
        const side = msg.to._id === user._id ? "left" : "right";
        return (
          <div key={msg._id} className={`inboxItem ${side}`}>
            {/* icon? */}
            <h3>{msg.from.username}</h3>
            <p>{msg.content}</p>
            <p className="timestamp">{new Date(msg.date).toLocaleString()}</p>
          </div>
        );
      })
    ) : (
      <div className="empty"></div>
    );

  const displayTitle = chain[0]?.title ? <h2>{chain[0].title}</h2> : null;

  function handleChange(e) {
    setReply(e.target.value);
  }

  function getLastMsg() {
    //search from the end for most recent
    //if (!chain[0].to._id) return null
    //const chain.find(msg => msg.from._id !== user._id)

    const output = () => {
      for (let i = chain.length - 1; i > -1; i--) {
        if (chain[i].from._id !== user._id) return chain[i];
      }
    };
    return output();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const friendMsg = getLastMsg();
    const message = {
      to: openMsg.from._id === user._id ? openMsg.to._id : openMsg.from._id,
      from: user._id, //get user_id from somewhere
      content: reply,
      date: new Date(),
      head: openMsg._id ? openMsg._id : null, //get from prop
      title: openMsg?.new ? title : "", //will only have title for first msg (?)
      seen: false,
    };
    console.log(message);
    console.log(friendMsg);
    const response = await sendInbox(message);
    console.log(response);
    if (response.err) return newNoti("error", response.err); //error handling
    else {
      //response.from = user;
      //response.messageToReplace = openMsg._id;
      setChain([...chain, response]);
      updateList(response);
      setReply("");
      setTitle("");
    }
  }

  return (
    <div className="inboxReply">
      {/* message chain here */}
      <div className="convoChain">
        {/*<h1>{openMsg?.to.username === user.username ? openMsg.from.username : openMsg.to.username}</h1>*/}
        {displayTitle}
        <span className="refreshBtn" onClick={refreshBtn}>
          <Icons iconName={"refresh"} />
        </span>
        {displayChain}
      </div>
      <form id="replyForm" onSubmit={handleSubmit}>
        <input
          type={openMsg?.new ? "text" : "hidden"}
          name="title"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          name="content"
          placeholder="Reply here.."
          value={reply}
          onChange={handleChange}
        />
        <button className="submitBtn" form="replyForm" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
