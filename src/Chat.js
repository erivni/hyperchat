import html2canvas from 'html2canvas';
import React, { useEffect, useState } from 'react'
import WebRtcClient from "./webRtcClient";


export default function Chat() {
    const [message, setMessage] = useState("your message will appear here!");
    useEffect(() => {
        if (!message) return;
        html2canvas(document.getElementById("message-bubble"), {
            backgroundColor: null,
            scale: 1
        }).then((canvas) => {
            const info = canvas.toDataURL();
            console.log(info);
            WebRtcClient.sendChatMessage(info, canvas.width, canvas.height)
        });
    }, [message])
    const onMessageSend = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const formData = new FormData(e.target)
        setMessage(formData.get('message'))
        e.target.reset()
    }
    return (
        <div className="screen m-screen">
            <div id="message-bubble" className="message bubble">
                <div className="bubble-point"></div>
                {message}
            </div>
            <form onSubmit={onMessageSend}>
                <input name="message" type="text" />
                <input type="submit" hidden />
            </form>
        </div >
    )
}
