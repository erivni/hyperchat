import html2canvas from 'html2canvas';
import React, { useEffect, useState } from 'react'
import Close from './Close';
import WebRtcClient from "./webRtcClient";

const DEFAULT_MESSAGE = "your message will appear here!"


export default function Chat() {
    const [message, setMessage] = useState(DEFAULT_MESSAGE);
    useEffect(() => {
        if (!message || message === DEFAULT_MESSAGE) return;
        html2canvas(document.getElementById("message-bubble"), {
            backgroundColor: null,
            scale: 1.5
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
                <b>{message}</b>
            </div>
            <form onSubmit={onMessageSend}>
                <input name="message" type="text" />
                <input type="submit" hidden />
            </form>
            <Close />
        </div >
    )
}
