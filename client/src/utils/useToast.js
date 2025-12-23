import React, { createContext, useContext, useEffect } from "react";
import { useState } from "react";
import {v4 as uuid} from 'uuid'

const ToastContext = createContext(null)

export function NotiProvider({children, notis, setNotis}) {

    //queue for notification deletions


    async function clearNotis() {
        //try to trigger slide out animation. slowly?
        inactivateAll()

        // setTimeout(() => {
        //     setNotis([])
        // }, 1000)
    }

    function inactivateAll() {
        if (!notis.length) {
            console.warn("Notifications Empty")
        }

        const deactiveOne = (noti) => {
                setNotis(prev => {
                    return prev.map(n => {
                    if (n.id === noti.id) {
                        return {...n, status: false}
                    }
                    return n
                    })
                })
        }

        //deactivate all notifications in the queue
        //staggering the timeout allows a cascading effect
        const totalAnimationTime = 200 * notis.length;
        notis.forEach((noti, index) => {
            setTimeout(() => {
                deactiveOne(noti)
            }, 200 * index);
        })
    }


    function deleteNoti(id) {
        setNotis(prev => prev.filter(noti => noti.id !== id))
    }



    function newNoti(type, message) {
        const myNoti = {
            id: uuid(),
            type,
            message,
            status: true,
        }
        if (notis.length === 0) {
            setNotis([myNoti])
        }
        else if (notis.length >= 5) {
            //cut the oldest out
            let slice = notis.slice(1)
            setNotis([...slice, myNoti])
        } else {
            setNotis([...notis, myNoti])
        }

        setTimeout(() => deleteNoti(myNoti.id), 1000 * 30)
    }

    return (
        <ToastContext.Provider value={{clearNotis, deleteNoti, newNoti}}>{children}</ToastContext.Provider>
    )
}

export function useNotis() {
    return useContext(ToastContext)
}