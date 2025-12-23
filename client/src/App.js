import './App.css';
import {Outlet, useLocation, useNavigate} from 'react-router-dom'
import React, { useEffect, useRef, useState } from 'react';
import Header from './components/header';
import { checkUser, logout } from './utils/auth';
import { AuthProvider } from './utils/useAuth';
import { NotiProvider } from './utils/useToast';
import NotiContainer from './utils/notiContainer';


function App() {

  const [user, setUser] = useState({_id: null})
  const [notis, setNotis] = useState([])
  const [logoutWarning, setLogoutWarning] = useState(false)
  //check null for initial state of timer
  const [timer, setTimer] = useState(null)
  const navi = useNavigate()
  const location = useLocation()
  let timerInterval = useRef(null)

  function getTimeLeft() {
    if (!user._id || user.tokenExp - Date.now() <= 0 ) return null
    else return user.tokenExp - Date.now()
  }
  //check if user is guest vs timed out
  function isGuest() {
    return !localStorage.getItem('user') ? true : false
  }


  //set countdown when user is changed?
  useEffect(() => {
    if (isGuest()) {
      return
    }

    if (!user._id) return

    if (!getTimeLeft()) {
      console.log('user not logged in or token expired')
      handleLogout()
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
    } else {
      const intervalID = setInterval(() => {
          if (getTimeLeft() < 0 || !getTimeLeft()) {
            //handleResetTimer()
            console.log('time up')
            navi('/login')
            return
          } else if (getTimeLeft() < (5000 * 60)) {
              console.log("trigger 5min warning")
              setTimer(getTimeLeft())
              setLogoutWarning(true)
              //trigger popup?
            }
        }, 5000)
        timerInterval.current = intervalID
      }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
      console.log('clearing timer')
      setTimer(0)
      setLogoutWarning(false)
    }
  },[user])


  //Check user on initial load and on location change
  useEffect(() => {
    const check = checkUser()
    console.log('Checking user state', check)
    //changing user state will trigger the timer
    if (check && !isGuest()) setUser(check)
    if (getTimeLeft() < 0 || !getTimeLeft()) return handleResetTimer()
    console.log({prev: user, checked: check})
    console.log(`Time until logout: ${getTimeLeft()}`)

  },[location])





  function handleResetTimer() {
    setUser({_id: null})
    logout()
    setTimer(0)
    setLogoutWarning(false)
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
    }
  }

  function handleLogout() {
    handleResetTimer()
    navi('/')
  }

//  const reenterPW = timer === "paused" 
//  ? <input />
//  : <button onClick={handleResetTimer}>Stay logged in?</button>

  const warning = logoutWarning ?
    <div className='logoutWarning'>
      <p>System will log you out in {Math.floor(timer / 1000)} seconds</p>
      <p onClick={() => {setLogoutWarning(false)}}>X</p>
      <div>
        <button onClick={handleResetTimer}>logout</button>
        <button onClick={handleLogout}>Return to login page</button>
      </div>
    </div>
  : null


  return (
    <div className="app">
      <AuthProvider user={user} setUser={setUser} setTimer={setTimer}>
        <NotiProvider notis={notis} setNotis={setNotis}>
          <NotiContainer notis={notis} />
          <Header />
          {warning}
          <div className='components'>
            <Outlet />
          </div>
        </NotiProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
