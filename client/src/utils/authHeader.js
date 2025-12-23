export function authHeader() {
    const token = JSON.parse(localStorage.getItem('token'))

    if (token) {
        return {  'x-access-token': token, Authorization: `Bearer ${token}` }
    } else {
        console.log('Token expired?')
        return
    }
}

export function authJson() {
    const token = JSON.parse(localStorage.getItem('token'))

    if (token) {
        return {
            'x-access-token': token, 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    } else return {'Content-Type': 'application/json'}
}