import {useRouteError} from 'react-router-dom'


export default function ErrorPage() {
    const error = useRouteError()
    console.error(error)


    return (
        <div className='errorPage'>
            <h1>Sorry.. hit a snag there</h1>
            <p>Unexpected error occured</p>
            <p>
                <i>{error.statusText || error.message}</i>
            </p>
        </div>
    )


}