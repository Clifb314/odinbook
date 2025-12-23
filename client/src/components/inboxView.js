import React, { useEffect, useState } from "react";
import {
  readInbox,
  findOrCreate,
  getInboxList,
  deleteInbox,
} from "../utils/dataAccess";
import InboxReply from "./inboxReply";
import InboxList from "./inboxList";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../utils/useAuth";
import { useNotis } from "../utils/useToast";
import IconDisplay from "../utils/iconHelper";
import Icons from "../utils/svgHelper";

export default function InboxView() {
  const [inboxList, setInboxList] = useState([]);
  const [openMsg, setOpenMsg] = useState(null);
  const [showTo, setShowTo] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [options, setOptions] = useState([]);
  const [searchString, setSearchString] = useState("");
  const [dropDownView, setDropDownView] = useState(false);

  const { newNoti } = useNotis();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navi = useNavigate();
  //const friend = useParams()

  async function getList() {
    const response = await getInboxList();
    console.log(response);
    if (response.err) return newNoti("error", response.err); //error handling
    else if (Array.isArray(response)) setInboxList(response);
    else if (response.message && !response.err)
      return newNoti("success", response.message);
    else newNoti("error", response.message);
  }

  async function handleDeleteMsg(id) {
    const response = await deleteInbox(id);
    if (response.err) newNoti("error", response.err);
    else {
      const updatedList = [...inboxList].filter((msg) => msg._id !== id);
      newNoti("success", response.message);
      console.log(updatedList);
      setInboxList(updatedList);
    }
  }

  function updateList(newMsg) {
    if (inboxList.length === 0) {
      setInboxList([newMsg]);
      setOpenMsg(newMsg);
    } else {
      const checkList = [...inboxList].filter(
        (msg) => msg._id !== newMsg.head
      );
      checkList.unshift(newMsg);
      console.log(checkList);
      setInboxList(checkList);
      setOpenMsg(newMsg);
    }
  }

  function getFriends() {
    if (user.friends) {
      setFriendsList([...user.friends]);
      let shortList = [];
      for (let i = 0; i < 5 && i < user.friends.length - 1; i++) {
        shortList.push(user.friends[i]);
      }
      setOptions(shortList);
    }
  }

  async function handleClickedMsg(msg) {
    if (!msg.seen) {
      const response = await readInbox(msg._id);
      if (response.err) newNoti("error", response.err);
      else console.log(response.messsage);

      const updatedList = inboxList.map((inboxItem) => {
        if (inboxItem._id === msg._id) {
          return { ...inboxItem, seen: true };
        } else return inboxItem;
      });
      setInboxList(updatedList);
    }
    setOpenMsg(msg);
  }

  async function findFromRedirect(friendID, username) {
    if (friendID === null) return console.log(`failed to redirect from ${username}`);
    if (searchString.length > 0) {
      dropDownFocus(false)

    }
    const data = await findOrCreate(friendID);
    console.log(data);
    if (data.err) return newNoti("error", data.err); //error handling
    else if (data.new) {
      let msg = {
        to: data.friendInfo,
        from: user,
        _id: null,
        new: true
      }
      setOpenMsg(msg);
    } else setOpenMsg(data);
  }

  function filterOptions(e) {
    const { value } = e.target;
    setSearchString(value);
    const regStr = `[\w]*${value}[\w]*`;
    const regexStr = new RegExp(regStr, "i");
    const filteredArr = friendsList.filter((friend) => {
      return regexStr.test(friend.username);
    });
    if (filteredArr.length > 0) {
      setOptions(filteredArr);
    } else {
      setOptions([
        {
          _id: null,
          username: "User not found",
        },
      ]);
    }
  }

  async function startChain() {
    //showTo ? setShowTo(false) : setShowTo(true)
    if (!showTo) {
      setShowTo(true);
      setSearchString("");
      let shortList = [];
      for (let i = 0; i < 5 && i < friendsList.length; i++) {
        shortList.push(friendsList[i]);
      }
      console.log(shortList);
      setOptions(shortList);
    } else {
      setShowTo(false);
      setSearchString("");
    }
  }

  function dropDownFocus(bool) {
    if (!bool) {
      setDropDownView(false)
    } else {
      setDropDownView(true)
    }
    setSearchString('')
    setOptions([...friendsList])

  }

  const dropDown = dropDownView ? (
    <div className="dropDown" onBlur={() => dropDownFocus(false)}>
      <h5>Friends</h5>
      <button onClick={() => dropDownFocus(false)}>X</button>
      {options.map((option) => {
        return (
          <p
            key={option._id}
            onClick={() => findFromRedirect(option._id, option.username)}
          >
            {option.username}
            <IconDisplay userID={option._id} username={option.username} icon={option.icon} />
          </p>
        );
      })}
    </div>
  ) : null;

  useEffect(() => {
    //use params to bring up a user after clicking from their page
    //let's check for messages to friend.id and return the most recent message chain
    //if none, create a new one
    if (searchParams.get("friend")) {
      const friendID = searchParams.get("friend");
      const username = searchParams.get("username");
      findFromRedirect(friendID, username);
    }
    getList();
    getFriends();
    return () => {
      setInboxList([]);
    };
  }, []);

  return (
    <div className="inbox">
      <div className="convos">
        <h2>Conversations</h2>

        <span
          className={showTo ? "closeSearch" : "openSearch"}
          onClick={startChain}
        >
        <Icons iconName={'expand'} />
        </span>

        <div className="friendSearchContainer">
          <input
            className="friendSearch"
            type={showTo ? "text" : "hidden"}
            name="to"
            id="to"
            placeholder="Search friends list"
            value={searchString}
            onChange={filterOptions}
            onFocus={() => dropDownFocus(true)}
            autoComplete="off"
          />
          {dropDownView ? dropDown : null}
        </div>
        <InboxList
          list={inboxList}
          handleClickedMsg={handleClickedMsg}
          handleDelete={handleDeleteMsg}
        />
      </div>
      <InboxReply
        openMsg={openMsg}
        updateList={updateList}
        refreshList={getList}
      />
    </div>
  );
}
