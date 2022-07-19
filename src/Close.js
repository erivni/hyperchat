import React, { useEffect } from 'react'

import WebRtcClient from './webRtcClient';

const Close = ({ hidden }) => {
    useEffect(() => {
        window.addEventListener('beforeunload', WebRtcClient.disconnect)
        return window.removeEventListener('beforeunload', WebRtcClient.disconnect);
    }, [])
    return (
        hidden ? null :
            <div className='footer'>
                <button className="button" onClick={WebRtcClient.disconnect}>close</button>
            </div>
    )
}
export default Close
