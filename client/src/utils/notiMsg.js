import React, { useState, useEffect } from "react";


export default function NotiMsg({type, message, status, onClick}) {

    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
      if (!status) {
        setIsActive(false)
      }
    }, [status])

    useEffect(() => {
        if (isActive) return;
        const closeTimer = setTimeout(() => {
          onClick()
        }, 500); // wait for animation to finish before calling onClick

        return () => clearTimeout(closeTimer);
    }, [isActive]); 

    // trigger slide out animation with state change
    function handleClick() {
        setIsActive(false)
    }

    return (
        <div className={`noti ${type} ${isActive ? 'active' : 'inactive'}`}>
            <span onClick={handleClick}>X</span>
            <p>{message}</p>
        </div>
    )

}