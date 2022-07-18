import React from 'react'

import WebRtcClient from './webRtcClient';

export default function Close() {
    return (
        <button className="button" onClick={WebRtcClient.disconnect}>Close</button>
    )
}
