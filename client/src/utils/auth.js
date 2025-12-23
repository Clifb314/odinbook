import {authHeader, authJson} from './authHeader'
const url = "http://localhost:3000/api/"


 export async function login(body) {
    try {
        const response = await fetch(`${url}auth/login`, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(body),
            headers: authJson()
        })
        const data = await response.json()
        console.log(data)
        if (!response.ok) {
            return data.message
        } else {
            const start = Date.now()
            console.log(start)
            const end = start + (1000 * 60 * 30)
            data.user.tokenExp = end
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('token', JSON.stringify(data.token))
            setTimeout(() => {
                console.log('Log out in 5mins')
            }, 1000 * 60 * 25)
            setTimeout(logout, (30 * 60 * 1000))
            console.log(`Will log out at ${new Date(end).toLocaleTimeString()}`)
            console.log(`Token will expire at ${data.user.tokenExp - Date.now()}`)

            return {message: 'Logged in', user: data.user}
        }
    } catch(err) {
        console.error("Error", err)
        return { err, message: "Could not access database"}
    }
}

export function logout() {
    localStorage.removeItem('user')
    return {message: 'Logged out!'}

}

//validation returns JSON w/ .message and errors[array of errors] on failure
//errors[0] is an obj w/ msg, value, type (ie field), path (ie username), location (body)
export async function register(body) {
    try {
        const response = await fetch(`${url}signup`, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(body),
            headers: authJson()
        })
        const data = await response.json()
        if (!response.ok) {
            //data will be JSON w/ errors[] and message
            return data
        } else {
            localStorage.setItem('user', JSON.stringify(data))
            //setTimeout(logout, 30 * 60 * 1000)
            return {message: 'Logged in', user: data.user}  
        }
    } catch(err) {
        console.error("Error", err)
        return { err, message: "Could not access database" }  
    }
}

export function checkUser() {
    const user = localStorage.getItem('user')
    //const output = JSON.parse(user)
    return user ? JSON.parse(user) : {_id: null}
}