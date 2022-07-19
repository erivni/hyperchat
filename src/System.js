import React, { forwardRef, useEffect, useState } from 'react'
import WebRtcClient from './webRtcClient';

const System = forwardRef((props, ref) => {
    const { connectionClosed } = props
    const [message, setMessage] = useState('')
    const [showSpinner, setShowSpinner] = useState(true);
    useEffect(() => {
        if (connectionClosed) {
            setShowSpinner(true)
            setMessage('')
        }
    }, [connectionClosed])

    const onMessageEvent = ({ message, interrupt }) => {
        setMessage(message);
        if (interrupt) {
            setShowSpinner(false);
        }
    }

    useEffect(() => {
        WebRtcClient.on('CONNECTION_STATUS_MESSAGE', onMessageEvent)
        return () => WebRtcClient.off('CONNECTION_STATUS_MESSAGE', onMessageEvent)
    }, [])
    return (
        <div ref={ref} className="screen r-screen">
            {showSpinner &&
                <div className='spinner-container'>
                    <i className="fa-solid fa-gear"></i>
                    <i className="fa-solid fa-gear"></i>
                    <i className="fa-solid fa-gear"></i>
                </div>}
            <p className='system-message'>{message}</p>
        </div>
    )
})
export default System
