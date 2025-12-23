import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFriendsList } from "../utils/dataAccess";
import {v4 as uuid} from 'uuid'



export default function FriendsList() {

    const [friends, setFriends] = useState([])

    async function fetchFriends() {
        const response = await getFriendsList()
        console.log(response)
        if (response.err || response.message) setFriends([])
        else if (response.length < 1) return
        else setFriends([...response])
    }

    useEffect(() => {
        fetchFriends()

        return () => setFriends([])
    }, [])

    const display = friends?.length > 0
    ? <ul>
        {friends.map(friend => {
            {/* icon */}
            return <li key={uuid()}><Link to={`/users/${friend._id}`}>
            {friend.username}
            </Link></li>
        })}
    </ul>
    : <p>Empty... Try adding someone!</p>

    return (
        <div className="friendsList">
            <h2>Friends</h2>
            {display}
        </div>
    )
}