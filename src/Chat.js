import html2canvas from 'html2canvas';
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { useUserData } from './UserData';
import WebRtcClient from "./webRtcClient";

const DEFAULT_MESSAGE = "your message will appear here!"
const MAX_MESSAGES = 10;

const Chat = forwardRef((props, ref) => {
    const { connectionClosed } = props
    const historyRef = useRef(null)
    const [userData] = useUserData()
    const [message, setMessage] = useState(DEFAULT_MESSAGE);
    const [historyMsgs, setHistoryMsgs] = useState([]);

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

    const handleNewMessage = (newMsg) => {
        setHistoryMsgs(prev => {
            let newMsgArray = [...prev, newMsg]
            if (newMsgArray.length > MAX_MESSAGES) {
                newMsgArray = newMsgArray.slice(newMsgArray.length - MAX_MESSAGES)
            }
            return newMsgArray
        })
    }
    useEffect(() => {
        if (!historyRef || !historyRef.current) return
        if (!historyMsgs.length) return
        
        historyRef.current.scrollTop = historyRef.current.scrollHeight
    }, [historyMsgs])

    useEffect(() => {
        WebRtcClient.on('DATA_CHANNEL_MESSAGE', handleNewMessage)
        return () => {
            WebRtcClient.off('DATA_CHANNEL_MESSAGE', handleNewMessage)
        }
    }, [])

    useEffect(() => {
        if (connectionClosed) {
            setMessage(DEFAULT_MESSAGE);
            setHistoryMsgs([]);
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
            <div id="history" ref={historyRef} className="history" >
                {historyMsgs.map((msg) => <HistoryMessage key={msg.id} {...msg} />)}
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

const HistoryMessage = ({ width, height, message }) => {
    const src = `data:image/png;base64,${message}`
    const imgHeight = height * 0.4
    const imgWidth = width * 0.4
    const opacity = 0.4
    return <img className='history-message' src={src} width={imgWidth} height={imgHeight} opacity={opacity}></img>
}

export default Chat