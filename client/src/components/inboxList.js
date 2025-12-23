import React, { useEffect, useState } from "react";
import { deleteInbox, getInboxList } from "../utils/dataAccess";
import { v4 as uuidv4 } from "uuid";
import { useAuthContext } from "../utils/useAuth";
import IconDisplay from "../utils/iconHelper";
import { useNotis } from "../utils/useToast";

export default function InboxList({ list, handleClickedMsg, handleDelete }) {


  const {user} = useAuthContext()
  const {newNoti} = useNotis()

  //might export this to main so header can show unread count




  const display =
    list?.length > 0 ? (
      list.map((msg) => {
        const displayName = user._id === msg.from._id ? {...msg.to} : {...msg.from}
        return (
          <div
            key={msg._id}
            className={`inboxList ${msg.seen ? "read" : "unread"}`}
          >
            {/* icon needed */}
            <div onClick={() => handleClickedMsg(msg)}>
              <IconDisplay icon={displayName.icon} userID={displayName._id} username={displayName.username} />
              <h2 className="username">{displayName.username}</h2>
              <p className="title">{msg.title}</p>
              <p className="content">{msg.from.username} : {msg.content.slice(0, 10)}{msg.content.length > 10 ? '...' : ''}</p>
              <p className="timestamp">{new Date(msg.date).toLocaleString()}</p>
            </div>
            <div className="delete-Btn"><button onClick={() => handleDelete(msg._id)} className="delete transparent">X</button></div>
          </div>
        );
      })
    ) : (
      <p>Inbox is empty!</p>
    );

  return <div className="convoList">{display}</div>;
}
