import React, { useEffect, useRef, useState } from 'react'
const DEFAULT_PROFILE_IMAGE = "data:image/png;base64,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";
const DEFAULT_PROFILE_IMAGE_SIZE = 100 // in pixels
export default function Capture({ onPictureCaptured, close }) {
    let streaming = false;

    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(120);

    const [inEditMode, setInEditMode] = useState(false)

    const [imageSrc, setImageSrc] = useState(DEFAULT_PROFILE_IMAGE);

    let canvasRef = useRef(null);
    let videoRef = useRef(null);

    const videoStreamStart = () => {
        console.log(videoRef)
        console.log(videoRef.current)
        console.log(videoRef.current?.videoHeight)
        console.log(videoRef.videoHeight)
        if (!streaming) {
            let _height = videoRef?.videoHeight / (videoRef?.videoWidth / width);

            // Firefox currently has a bug where the height can't be read from
            // the video, so we will make assumptions if this happens.

            if (isNaN(_height)) {
                _height = width / (4 / 3);
            }
            setHeight(_height)
            streaming = true;
        }
    }

    const switchToEditMode = () => { setInEditMode(true); }

    const takePicture = () => {
        if (!canvasRef) {
            console.log("canvasRef does not exist")
            return
        }
        const context = canvasRef.getContext('2d');
        console.log(context, width, height)
        if (width && height) {
            context.drawImage(videoRef, 0, 0, width, height);
            const data = canvasRef.toDataURL('image/png');
            setImageSrc(data)
            onPictureCaptured(data)
            setInEditMode(false)
        }
    }
    const startVideoStream = () => {
        if (!videoRef) {
            return
        }
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                videoRef.srcObject = stream;
                videoRef.play();
            }).catch(function (err) {
                console.log("An error occurred: " + err);
            });

    }

    useEffect(() => {
        if (inEditMode) startVideoStream();
        console.log(`in edit mode ${inEditMode}`)
    }, [inEditMode])

    useEffect(() => {
        if (close) {
            setInEditMode(false)
            if (!videoRef || !videoRef.srcObject) {
                return
            }
            const tracks = videoRef.srcObject.getTracks()
            console.log(tracks)
            tracks.forEach(track => track.stop())
        }
    }, [close])

    const profileSize = Math.min(width, height) || DEFAULT_PROFILE_IMAGE_SIZE
    const profileSizePx = `${profileSize}px`
    const containerHeightPx = `${profileSize * 1.5}px`
    // note - the video has to be present on the page, event if its hidden, so we can stop it on close
    return (
        <div>
            <div className="camera" style={{ height: containerHeightPx }}>
                <video hidden={!inEditMode} width={width} height={height} ref={ref => videoRef = ref} id="video" onCanPlay={videoStreamStart}>Video stream not available.</video>
                <div hidden={inEditMode} className='profile-image' style={{ height: profileSizePx, width: profileSizePx }} >
                    <img alt='profile image' src={imageSrc} />
                </div>
                {inEditMode ?
                    <button onClick={takePicture} className='button icon-button'><i className="fa-solid fa-camera"></i></button> :
                    <button onClick={switchToEditMode} className='button icon-button'><i className="fa-solid fa-pen"></i></button>
                }
            </div>

            <canvas className='hidden' width={width} height={height} ref={ref => canvasRef = ref} id="canvas">
            </canvas>
        </div >
    )
}
