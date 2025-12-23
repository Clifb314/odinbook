import React, {useState} from "react";
import {Link} from 'react-router-dom'
import { acceptReq, delReq, rescReq } from "../utils/dataAccess";
import {v4 as uuid} from 'uuid'
import { useAuthContext } from "../utils/useAuth";
import Icons from "../utils/svgHelper";
import { useNotis } from "../utils/useToast";

export default function Header() {
    const {user, updateUser, logoutUser} = useAuthContext()
    const {newNoti} = useNotis()

    const [showReqs, setShowReqs] = useState(false)

    //count unread messages
    function newMsgCount(inbox) {
        if (!inbox?.length) return null
        const unseenMsgs = inbox.filter(msg => msg.seen === false)
        return unseenMsgs.length
    }

    function handleToggle() {
        showReqs ? setShowReqs(false) : setShowReqs(true)
    }

    //handle updating user state after friend request actions
    function handleUpdateUser(type, data) {
        if (type === 'added') {
            //remove request to and add to friends
            updateUser({
                ...user,
                requests: [...user.requests, data],
                friends: [...user.friends, data]
            })
            newNoti('success', `Added ${data.username} as a friend!`)

        } else if (type === 'deleted') {
            //remove request from requests
            const updatedRequests = user.requests.filter(req => req._id !== data._id)
            updateUser({
                ...user,
                requests: updatedRequests
            })
            newNoti('success', `Deleted request from ${data.username}`)
        } else if (type === 'rescinded') {
            //remove request from pending
            const updatedPending = user.pending.filter(req => req._id !== data._id)
            updateUser({
                ...user,
                pending: updatedPending
            })
            newNoti('success', `Rescinded request to ${data.username}`)
        }
    }


    //accept request
    async function handleAddFriend(friend) {
        const response = await acceptReq(friend._id)
        if (response.err) return newNoti('error', response.err) //error handling
        else return handleUpdateUser('added', friend) //update user state
    }

    //delete request
    async function handleDeleteReq(friend) {
        const response = await delReq(friend._id)
        if (response.err) return newNoti('error', response.err) //error handling
        else return handleUpdateUser('deleted', friend) //update user state
    }

    async function handleRescind(friend) {
        const response = await rescReq(friend._id)
        if (response.err) return newNoti('error', response.err) //error handling
        else return handleUpdateUser('rescinded', friend) //update user state
    }

    const pending = user?.pending?.length > 0 
    ?  <ul className="pendingReqs">
        {/*pending requests, rescind button*/}
        {user.pending.map(req => {
            return <li key={uuid()}>
                        {/*icon*/}
                        <Link to={`users/${req._id}`}>{req.username}</Link>
                        <button className="transparent reject" type="button" onClick={() => handleRescind(req)}>-</button>
            </li>
        })}
    </ul>
    : null

    //need to make logging in return populated friend request usernames
    const requests = showReqs && (user.requests?.length > 0 || user?.pending?.length > 0)
    ? <div className="friendReqs">
        <p>Friend Requests</p>
        <ul className="friendReqList">
            {/*friend requests, accept and delete buttons*/}
            {user.requests.map(request => {
                return <li key={uuid()}>
                    {/*icon*/}
                    <Link to={`users/${request._id}`}>{request.username}</Link>
                    <div>
                        <button type="button" className="transparent accept" onClick={() => handleAddFriend(request)}>+</button>
                        <button type="button" className="transparent reject" onClick={() => handleDeleteReq(request)}>-</button>
                    </div>
                </li>
            })}
        </ul>
        <p>Pending Requests</p>
        {pending}
    </div>
    : null //add icon with number

    return (
        <div className="header">
                <ul className="headLinks">
                    <li><Link to='/'>Home</Link></li>
                    <li><Link to='/feed/recent'>Recent Posts</Link></li>
                    <li><Link to={'/feed/top'}>Top Posts</Link></li>
                </ul>
                <div className="logo">
                    <h1>ClifBook</h1>
                    </div>
                {user._id ?
                    <ul className="authLinks">
                        <li>
                            <Link to='/inbox'>Inbox</Link>
                            {user.inbox?.length > 0 && newMsgCount() ? <div className="counter">{newMsgCount()}</div> : null }
                        </li>
                        <li><Link to='/account'>
                            <Icons iconName={'acc_settings'} />
                            </Link></li>
                        <li onClick={handleToggle}>
                            Friend Requests
                            {user.pending?.length > 0 && <div className="counter">{user.pending.length}</div>}
                            {requests}
                        </li>
                        <li><Link onClick={logoutUser} to='/'>Log Out</Link></li>
                    </ul>
                    :
                    <ul className="guestLinks">
                        <li><Link to='/login'>Log In</Link></li>
                        <li><Link to='/register'>Register</Link></li>
                    </ul>
                }
        </div>
    )
}