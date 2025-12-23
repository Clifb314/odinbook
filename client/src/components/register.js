import React, { useEffect, useState } from "react";
import { register } from "../utils/auth";
import { editIcon, googleAuth } from "../utils/dataAccess";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../utils/useAuth";
import { useNotis } from "../utils/useToast";

export default function Register() {
  const { user, updateUser } = useAuthContext();
  const {newNoti} = useNotis()
  const navi = useNavigate();


  useEffect(() => {
    if (user._id) {
      navi('/account')
    }

  },[])

  const iconTemplate = {
    url: null,
    size: null,
    file: null
  }

  const template = {
    username: "",
    fName: "",
    lName: "",
    email: "",
    password: "",
    checkPW: "",
    bday: "",
    googleAcct: null,
  };
  const [valErrs, setValErrs] = useState([]);
  const [userInfo, setUserInfo] = useState(template);
  const [iconPreview, setIconPreview] = useState(iconTemplate)



  /* Errors, validation */

  const displayErrs =
  valErrs?.length > 0 ? (
    <div className="validationErrors">
      {valErrs.map((err) => {
        return (
          <p>
            {err.path} : {err.msg}
          </p>
        );
      })}
    </div>
  ) : null;



  /* functions */
  function handleChange(e) {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  }

  function handleIcon(e) {
    //const {files} = e.target
    const imgFile = e.target.files[0]
    //setUserInfo({...userInfo, icon: imgFile})
    setIconPreview({
      url: URL.createObjectURL(imgFile),
      size: `${imgFile.size / 1000} bytes`,
      file: imgFile
    })
  }

  async function getGoogleInfo(e) {
    const googleInfo = await googleAuth();
    //pretty sure this needs to redirect to google some other way
    if (googleInfo.err) newNoti("error", googleInfo.err); //error handling
    else {
      setUserInfo({ ...userInfo, googleAcct: googleInfo });
      newNoti("success", "Google account linked!");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValErrs([]);
    const signup = await register(userInfo);
    console.log(signup);
    if (signup.err) {
      //server error
      newNoti("error", signup.err);
      return;
    }
    else if (!signup.user || signup.errors) {
      //validation errors
      setValErrs(signup.errors);
      return newNoti('error', 'Validation errors. Please review and resubmit');
    }
    else if (iconPreview.file) {
      //create icon from same method to update icon
      const iconForm = new FormData();
      iconForm.append("icon", iconPreview.file);
      const response = await editIcon(iconForm);
      if (response.err) newNoti("error", response.err); //error handling
    } 
    
      updateUser(signup.user);
      navi("/feed/recent");
      newNoti("success", `Welcome to CliffBook, ${signup.user.username}!`);
    //set user higher up?
  }


  /* regex errors */




  return (
    <div className="register">
      <div className="registerText">
        <h1>CliffBook</h1>
        <p>Register and join in on the discussion!</p>
      </div>
      <form className="registerForm" onSubmit={handleSubmit}>
        <label htmlFor="username">Username: </label>
        <input
          name="username"
          id="username"
          value={userInfo.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />
        <label htmlFor="fName">First Name: </label>
        <input
          name="fName"
          id="fName"
          value={userInfo.fName}
          onChange={handleChange}
          autoComplete="given-name"
          required
        />
        <label htmlFor="lName">Last Name: </label>
        <input
          name="lName"
          id="lName"
          value={userInfo.lName}
          onChange={handleChange}
          autoComplete="family-name"
          required
        />
        <label htmlFor="email">Email: </label>
        <input
          name="email"
          id="email"
          value={userInfo.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        <label htmlFor="bday">Birthday: </label>
        <input
          name="bday"
          id="bday"
          type="date"
          value={userInfo.bday}
          onChange={handleChange}
          autoComplete="bday"
          required
        />
        <label htmlFor="password">Password: </label>
        <input
          name="password"
          id="password"
          type="password"
          value={userInfo.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
        <label htmlFor="checkPW">Re-enter Password: </label>
        <input
          name="checkPW"
          id="checkPW"
          type="password"
          value={userInfo.checkPW}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
        <label htmlFor="icon">Upload Icon:</label>
        <input type="file" name="icon" id="icon" accept="image/*" onChange={handleIcon} />
        {iconPreview.url 
        ? <div className="icon"><img src={iconPreview.url} alt="Preview of your uploaded icon" /></div>
        : null
         }
        <button className="submitBtn" type="submit">
          Submit
        </button>
        <button className="gBtn" type="button" onClick={getGoogleInfo}>
          G!
        </button>
      </form>
      {displayErrs}
    </div>
  );
}
