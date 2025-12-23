import React, { useEffect, useState } from "react";
import { getUserDetail, addFriend, delFriend, getUserIcon } from "../utils/dataAccess";
import FriendsList from "./FriendsList";
import PostCard from "./postCard";
import { Link, useNavigate, useParams } from "react-router-dom";
import { checkUser } from "../utils/auth";
import { useAuthContext } from "../utils/useAuth";
import Icons from "../utils/svgHelper";
import { useNotis } from "../utils/useToast";

//need to get id from params
export default function UserPage() {
    const [userDetails, setUserDetails] = useState(null)
    const [friended, setFriended] = useState(false)
    const [redirect, setRedirect] = useState('')
    const [imgSrc, setImgSrc] = useState(null)


    const id = useParams().userid
    const navigate = useNavigate()
    const searchParam = new URLSearchParams({friend: id})
    const {user, updateUser} = useAuthContext()
    const {newNoti} = useNotis()

    async function getUser() {
        const response = await getUserDetail(id)
        if (response.err) {
            newNoti('error', "User not found")
            console.error(response.err) //error handling
            return navigate('/')
        }
        console.log(response)
        setUserDetails(response)
        searchParam.append('username', response.username)
        setRedirect(searchParam)
        //should set up an effect for when request is pending
        setFriended(response?.friends?.find(friend => friend._id === user._id) ? true : false)
        if (!response.icon) return
        else {
            const iconBlob = await getUserIcon(id)
            setImgSrc(URL.createObjectURL(iconBlob))
        }

    }

    useEffect(() => {
        const myUser = checkUser()
        if (!myUser._id) {
            navigate('/login')
        }
        getUser()
        console.log(userDetails)
        return () => setUserDetails(null)
    }, [id])

    /* Propagate updates on client side */
    function updateFriends(type) {
        if (!userDetails) return newNoti('error', 'No user details found')
        if (type === 'deleted') {
            const updatedFriendsList = user.friends.filter(friend => friend._id !== id)
            console.log(updatedFriendsList)
            updateUser({
                ...user,
                friends: updatedFriendsList
            })
            newNoti('success', 'Friend removed')
            setFriended(false)
        }

        if (type === 'added') {
            const {username, _id, icon} = userDetails
            const addedFriend = {
                _id,
                username,
                icon
            }
            const updatedPendingList = [...user.pending].push(addedFriend)
            updateUser({
                ...user,
                pending: updatedPendingList
            })
            newNoti('success', 'Friend request sent')
            //should set to pending
            setFriended(true)
        }
    }


    /* functions */

    async function handleFriend() {
        if (user.pending?.find(friend => friend._id === id)) {
            newNoti('error', 'Friend request already sent')
            return
        }


        const response = await addFriend(id)
        if (response.err) return newNoti('error', response.err) //error handling
        else return updateFriends('added')
    }

    async function handleDelFriend() {
        if (!user.friends?.find(friend => friend._id === id)) {
            newNoti('error', 'You are not friends with this user')
            return
        }
        const response = await delFriend(id)
        if (response.err) return newNoti('error', response.err) //error handling
        else return updateFriends('deleted')
    }


    /* Constants, conditionals */

    const displayFriends = userDetails?.friends?.length > 0 
    ? <ul>
        {userDetails.friends.map(friend => {
            return <li key={friend._id}><Link to={`/users/${friend._id}`}>{friend.username}</Link></li>
        })}
      </ul>

    : <p>{userDetails?.username ? userDetails.username : 'This user'} has no friends..</p>


    const posts = userDetails?.posts?.length > 0 
    ? <div className="feed acct">
    {userDetails.posts.map((post) => {
      return (
        <div key={post._id}>
          <PostCard post={post} userid={userDetails._id} />
        </div>
      );
    })}
  </div>
    : <p>{userDetails?.username ? userDetails.username : 'This user'} has no posts</p>


    const parseIcon = userDetails?.icon && imgSrc ? 
    <div className="icon"><img src={imgSrc} alt={userDetails.username + "'s icon"} /></div>
    : null

    const showDetails = userDetails ? 
    <div className="userPage">
    {/*icon*/}
    <div className="userDetails">
        <div>
            {parseIcon}
            <h1>{userDetails.username}</h1>
            <p>Name: {userDetails.userDetails.fullName}</p>
            <p>Age: {userDetails.getAge}</p>
            <p>Email: {userDetails.userDetails.email}</p>

            <div>
                <span onClick={friended ? handleDelFriend : handleFriend}>
                    <Icons iconName={friended ? 'person_del' : 'person_add'} />
                </span>
                <Link to={friended ? `/inbox?${redirect}` : '/inbox'}>
                    <Icons iconName={'mail'} />
                </Link>
            </div>

        </div>
        <div className="friendsList">
            <h2>Friends</h2>
            {displayFriends}
        </div>
    </div>

</div> :
    null
    //add send inbox button that prepopulates message or pulls up most recent convo

    return (
        <div className="accountPage">
            {showDetails}
            {posts}
            </div>
    )

}