import html2canvas from 'html2canvas';
import React, { forwardRef, useState } from 'react'
import { useUserData } from './UserData';
import WebRtcClient from "./webRtcClient";

const DEFAULT_MESSAGE = "your message will appear here!"

const Chat = forwardRef((props, ref) => {
    const [userData, _] = useUserData()
    const [message, setMessage] = useState(DEFAULT_MESSAGE);

    const sendMessage = () => {
        if (!message || message === DEFAULT_MESSAGE) return;
        html2canvas(document.getElementById("message-bubble"), {
            backgroundColor: null,
            scale: 1.5
        }).then((canvas) => {
            const info = canvas.toDataURL();
            console.log(info);
            WebRtcClient.sendChatMessage(info, canvas.width, canvas.height)
        });
    }

    const onMessageChange = (e) => {
        setMessage(e.target.value)
    }
    const onFormSubmitted = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const formData = new FormData(e.target)
        setMessage(formData.get('message'))
        e.target.reset()
        sendMessage();
    }
    return (
        <div ref={ref} className="screen m-screen">
            <div id="message-bubble" className="message bubble">
                <p className='profile-image'><img alt='profile image' src={userData?.profileImage} /></p>
                <div className='text' style={{ "backgroundColor": userData?.color }}>
                    <p className='username'>{userData?.username}</p>
                    <p className='message'>{message}</p>
                </div>
            </div>
            <form onSubmit={onFormSubmitted}>
                <input name="message" type="text" onChange={onMessageChange} />
                <input type="submit" hidden />
            </form>
        </div >
    )
})
export default Chat
