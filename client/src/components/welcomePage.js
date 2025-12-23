import React, { useEffect } from "react";
import { useAuthContext } from "../utils/useAuth";
import { useNavigate } from "react-router-dom";


export default function Welcome() {
    const {user} = useAuthContext()
    const navi = useNavigate()


    useEffect(() => {
        if (user._id) {
            navi('/account')
        }
    },[])


    return (
        <div>
            <p>Welcome to the hottest new social media platform!</p>
            <p>Login or register above</p>
            <p>You can take a peak at our latest posts as well, but make an account to join the fun!</p>
        </div>
    )
}