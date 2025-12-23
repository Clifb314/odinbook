import React, { useEffect, useState } from "react";
import {
  getAccount,
  editAccount,
  editIcon,
  getIcon,
  googleAuth,
} from "../utils/dataAccess";
import FriendsList from "./FriendsList";
import PostCard from "./postCard";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../utils/useAuth";
import Icons from "../utils/svgHelper";
import FormHelper from "../utils/formHelper";
import { v4 as uuid } from "uuid";

export default function Account() {
  const previewTemplate = {
    url: null,
    size: null,
    file: null,
  };

  const userTemplate = {
    userDetails: {
      fName: '',
      lName: '',
      birthdate: '',
      email: '',
    },
    username: '',
    password: '',
    checkPW: '',
    oldPW: '',
    posts: []
  }

  const [myPage, setMyPage] = useState(userTemplate);
  const [editting, setEditting] = useState(false);
  const [iconBlob, setIconBlob] = useState(null);
  const [previewIcon, setPreviewIcon] = useState(previewTemplate);

  const { user, logoutUser } = useAuthContext();
  const redirect = useNavigate();

  const getUser = async () => {
    if (!user._id) redirect("/login");
    else {
      const fetchUser = await getAccount();
      if (fetchUser.err) {
        logoutUser();
        return redirect("/login");
      }

      let updatePosts = [...fetchUser.posts].map((post) => {
        return {
          ...post,
          author: {
            username: user.username,
            _id: user._id,
            icon: user.icon,
          },
        };
      });

      let modifiedUser = { ...fetchUser.userDetails };
      if (modifiedUser.birthdate) {
        modifiedUser.birthdate = new Date(fetchUser.userDetails.birthdate)
          .toISOString()
          .slice(0, 10);
      }

      const names = modifiedUser.fullName.split(" ");
      setMyPage({
        ...fetchUser,
        userDetails: { ...modifiedUser, fName: names[0], lName: names[1] },
        posts: updatePosts,
        password: "",
        checkPW: "",
        oldPW: "",
      });
      if (fetchUser.icon) {
        const blob = await getIcon();
        const imgURL = URL.createObjectURL(blob);
        setIconBlob(imgURL);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      redirect("/");
    }
    //error handling here
    else {
      getUser();

    }
    return () => setMyPage(userTemplate);
  }, []);



  /* Functions */

  function toggle() {
    editting ? setEditting(false) : setEditting(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    //const { lName, fName } = myPage.userDetails;
    //const body = JSON.parse(e.target)
    const body = {
      ...myPage,
      ...myPage.userDetails
    };
    const submit = await editAccount(body);
    if (submit.err) return submit.err; //handle error
    //abort icon update if above fails
    else if (previewIcon.file) {
      const iconBody = new FormData();
      iconBody.append("icon", previewIcon.file);
      const submitIcon = await editIcon(iconBody);
      if (submitIcon.err) console.log(submitIcon.err);
      else setPreviewIcon(previewTemplate);
    }
    toggle();
    console.log(submit)

    return submit.message; //display submit.message
  }

  function handleChange(e) {
    const { value, name } = e.target;
    const checker = ['fName', 'lName', 'birthdate', 'email']
    if (checker.includes(name)) {
      setMyPage({
        ...myPage,
        userDetails: {
          ...myPage.userDetails,
          [name]: value
        }
      })
    } else {
      setMyPage({ ...myPage, [name]: value });
    }
  }

  function handleChangeIcon(e) {
    const { files } = e.target;
    setPreviewIcon({
      url: URL.createObjectURL(files[0]),
      size: `${files[0].size / 1000} bytes`,
      file: files[0],
    });
  }

  async function handleGoogle() {
    console.log('testing google')
    const gData = await googleAuth()
    console.log(gData)
    if (gData.err) return //err noti
    else return //success noti
  }

  /* constants, conditionals */

  const myPosts =
    myPage?.posts.length > 0 ? (
      <div className="feed acct">
        {myPage.posts.map((post) => {
          return (
            <div key={post._id}>
              <PostCard post={post} userid={myPage._id} />
            </div>
          );
        })}
      </div>
    ) : (
      <p className="feed acct">Nothing's here... Try posting something!</p>
    );

  const imgSettings = editting ? (
    <div className="editIcon">
      <input
        accept="image/*"
        name="icon"
        id="icon"
        type="file"
        onChange={handleChangeIcon}
        autoComplete="photo"
      />
      {previewIcon.url ? (
        <span>
          <p>Preview: </p>
          <div className="icon">
            <img className="icon" alt='Current icon' src={previewIcon.url} />
            <button type="button" onClick={() => setPreviewIcon(previewTemplate)}>
              Clear
            </button>
            <p>Size: {previewIcon.size}</p>
          </div>
        </span>
      ) : null}
    </div>
  ) : iconBlob ? (
    <img className="icon" alt="Current icon" src={iconBlob} />
  ) : (
    <p>Try Uploading an icon!</p>
  );

  const displayInfo = myPage ? (
    <div>
      <h1>{myPage.username}</h1>
      <p>Name: {myPage.userDetails.fullName}</p>
      <p>Age: {myPage.getAge}</p>
      <p>Birthday: {myPage.userDetails.birthdate}</p>
      <p>Email: {myPage.userDetails.email}</p>
    </div>
  ) : (
    <p>Must be logged in to access this page</p>
  );

  const formOpts = [
    { field: "username", label: "Username", data: myPage.username, autocomplete: 'username', key: uuid() },
    { field: "email", label: "e-mail", data: myPage.userDetails.email, autocomplete: 'email', key: uuid() },
    { field: "fName", label: "First Name", data: myPage.userDetails.fName, autocomplete: 'given-name', key: uuid() },
    { field: "lName", label: "Last Name", data: myPage.userDetails.lName, autocomplete: 'family-name', key: uuid() },
    { field: "birthdate", label: "Birthday", data: myPage.userDetails.birthdate, autocomplete: null, key: uuid() },
    { field: "password", label: "New Password", data: myPage.password, autocomplete: 'new-password', key: uuid() },
    { field: "checkPW", label: "Re-enter New Password", data: myPage.checkPW, autocomplete: 'new-password', key: uuid() },
    { field: "oldPW", label: "Current Password", data: myPage.oldPW, autocomplete: 'current-password', key: uuid() },
  ];

  const displayForm =
    (
      <form id="accountForm" onSubmit={handleSubmit}>
        <p>User Details: </p>
        { formOpts.map((input, index) => {
          return (
            <FormHelper
              key={index}
              field={input.field}
              label={input.label}
              data={input.data}
              auto={input.autocomplete}
              change={handleChange}
            />
          );
        })}

        <div className="icon-acct">
          <p>Change Icon: </p>
          <div className="icon-settings">{imgSettings}</div>
        </div>
        <button type="submit" onClick={handleSubmit}>
          Submit
        </button>
        <p>Add Google acccount!</p>
        <button type="button" onClick={handleGoogle}>G!</button>
      </form>
    )

  const friendsListDiv = myPage?.friends?.length > 0 ? (
    <FriendsList />
  ) : (
    <div>Friend list is empty..</div>
  );

  return (
    <div className="accountPage">
      <div className="userDetails">
        {iconBlob ? (
          <div className="icon">
            <img alt={myPage.username + "'s icon"} src={iconBlob} />
          </div>
        ) : null}
        {editting ? displayForm : displayInfo}
        <div className="interactBtn">
          <span onClick={toggle}>
            <Icons iconName={editting ? "delete" : "edit"} />
          </span>
        </div>
        <h1>Friends List</h1>
        {friendsListDiv}
      </div>
      {myPosts}
    </div>
  );
}
