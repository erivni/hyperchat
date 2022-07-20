import html2canvas from 'html2canvas';
import React, { forwardRef, useEffect, useState } from 'react'
import { useUserData } from './UserData';
import WebRtcClient from "./webRtcClient";

const DEFAULT_MESSAGE = "your message will appear here!"
const MAX_MESSAGES = 10;

export const Chat = forwardRef((props, ref) => {
    const { connectionClosed } = props
    const [userData] = useUserData()
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

    useEffect(() => {
        if (connectionClosed) {
            setMessage(DEFAULT_MESSAGE);
        }
    }, [connectionClosed])

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
            <div id="history" ref={ref} className="history">
            </div >
            <div id="message-bubble" className="message bubble">
                <p className='profile-image'><img alt='profile' src={userData?.profileImage} /></p>
                <div className='text' style={{ "backgroundColor": userData?.color }}>
                    <p className='username'>{userData?.username}</p>
                    <p className='message'>{message}</p>
                </div>
            </div>
            <form onSubmit={onFormSubmitted} style={{ flexDirection: "row" }}>
                <input name="message" type="text" onChange={onMessageChange} />
                <label><input type="submit" hidden /><i className="fa-solid fa-paper-plane"></i></label>
            </form>
        </div >
    )
})

export const  addMessageToHistory = (msg) => {
        let history = document.getElementById("history");
        let newChatMsg = document.createElement("img");
        let message = JSON.parse(msg);

        if (!message || !message?.result || !message.result.message || !message.result.height || !message.result.width) {
            // ignore malformed message
            return
        }

        newChatMsg.className = "history-message";
        newChatMsg.src = "data:image/png;base64," + message.result.message;
        newChatMsg.height = message.result.height * 0.4;
        newChatMsg.width = message.result.width * 0.4;
        newChatMsg.opacity = 0.4;
        history.appendChild(newChatMsg);

        let oldMessages = document.getElementById("history").children;
        if (oldMessages.length > MAX_MESSAGES) {
            debugger
            for (let i=0; i< oldMessages.length-MAX_MESSAGES; i++) {
                history.removeChild(oldMessages[i]);
            }
        }

        history.scrollTop = history.scrollHeight;
}