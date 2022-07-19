import React, { forwardRef, useEffect, useState } from 'react'
import WebRtcClient from './webRtcClient';

const System = forwardRef((props, ref) => {
    const [message, setMessage] = useState('')
    const [showSpinner, setShowSpinner] = useState(true);
    useEffect(() => {
        WebRtcClient.on('CONNECTION_STATUS_MESSAGE', setMessage)
    }, [])
    return (
        <div ref={ref} className="screen r-screen">
            {message}
            {showSpinner && <div>spinner</div>}
        </div>
    )
})
export default System
