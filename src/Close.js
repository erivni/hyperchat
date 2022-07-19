import React, { useEffect } from 'react'

import WebRtcClient from './webRtcClient';

const Close = ({ onCloseComplete, hidden }) => {
    const onClose = () => {
        WebRtcClient.disconnect()
        onCloseComplete()
    }
    useEffect(() => {
        window.addEventListener('beforeunload', WebRtcClient.disconnect)
        return window.removeEventListener('beforeunload', WebRtcClient.disconnect);
    }, [])
    return (
        hidden? null : <div className='footer'><button className="button" onClick={onClose}>Close</button></div>
    )
}
export default Close
