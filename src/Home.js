import React, { forwardRef } from 'react'
import WebRtcClient from './webRtcClient';

const Home = forwardRef((props, ref) => {
    const { onInitialization } = props
    const connectToWebRtc = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const formData = new FormData(e.target);
        WebRtcClient.initialize(formData.get('deviceId'), null, "http://signaling.hyperscale.coldsnow.net:9090", formData.get('useStun'))
        onInitialization();
    }
    return (
        <div ref={ref} className="screen f-screen">
            <form onSubmit={connectToWebRtc}>
                <input type="text" placeholder="your device id" id="deviceId" name="deviceId" />
                <input type="submit" value="CONNECT" />
                <label>
                    <input type="checkbox" value="useStun" id="useStun" name="useStun" />useStun
                </label>
            </form>
        </div>
    )
})
export default Home;
