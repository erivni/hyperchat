import { events, connectionStates } from '@constants';

const EventEmitter = require('events');

const dataChannelOptions = {
    ordered: true, // do not guarantee order
    maxPacketLifeTime: 3000, // in milliseconds
};

class Client extends EventEmitter {
    constructor() {
        super();
        this.deviceId = undefined;
        this.connectionId = undefined;
        this.connectedTranscontainer = undefined;
        this.signalingServer = undefined;
        this.peerConnection = undefined;
        this.dataChannel = undefined;
        this.pluginId = undefined;

        this.initialize = this.initialize.bind(this);

        this.emitStatEvent = this.emitStatEvent.bind(this);
        this.emitCurrentStatEvent = this.emitCurrentStatEvent.bind(this);
        this.emitLogEvent = this.emitLogEvent.bind(this);
        this.emitConfigurationEvent = this.emitConfigurationEvent.bind(this);
        this.emitProfilesEvent = this.emitProfilesEvent.bind(this);

        this.getAllStats = this.getAllStats.bind(this);
        this.getCurrentStats = this.getCurrentStats.bind(this);
        this.getConfig = this.getConfig.bind(this);
        this.getProfiles = this.getProfiles.bind(this);
        this.getAnswer = this.getAnswer.bind(this);

        this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
        this.handleIceCandidate = this.handleIceCandidate.bind(this);
        this.handleTrack = this.handleTrack.bind(this);
        this.handleDataChannelMessage = this.handleDataChannelMessage.bind(this);

        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.sendDataChannelMessage = this.sendDataChannelMessage.bind(this);
        this.sendJsonConfigUpdate = this.sendJsonConfigUpdate.bind(this);
        this.sendDebugVideoMsg = this.sendDebugVideoMsg.bind(this);
        this.sendOffer = this.sendOffer.bind(this);

        this.removeListeners = this.removeListeners.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    initialize(deviceId, connectionId, signalingServer, useStun) {
        if (this.deviceId === deviceId) {
            return; // handling in case initialize is called wth the same device id multiple times
        }
        this.deviceId = deviceId;
        this.connectionId = connectionId
        this.signalingServer = signalingServer;
        this.peerConnection = new RTCPeerConnection();
        if (useStun) {
            this.peerConnection.setConfiguration({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
        }
        this.dataChannel = this.peerConnection.createDataChannel('hyperscale', dataChannelOptions);

        this.dataChannel.onopen = () => {
            this.emitLogEvent('dataChannel has opened')
            this.emit(events.DATA_CHANNEL_OPEN, "")
        }
        this.dataChannel.onclose = () => this.emitLogEvent('dataChannel has closed')
        this.dataChannel.onmessage = this.handleDataChannelMessage;

        this.peerConnection.ontrack = this.handleTrack
        this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange
        this.peerConnection.onicecandidate = this.handleIceCandidate
        this.peerConnection.addTransceiver('video', { 'direction': 'sendrecv' })
        this.peerConnection.addTransceiver('video', { 'direction': 'sendrecv' })
        this.peerConnection.addTransceiver('audio', { 'direction': 'sendrecv' })
        this.peerConnection.createOffer().then(d => this.peerConnection.setLocalDescription(d)).catch(this.emitLogEvent);
        // console.log(this.peerConnection);
    }

    async getAnswer(connectionId) {
        try {
            this.emitLogEvent("trying to get answer..");

            let response = await fetch(`${this.signalingServer}/signaling/1.0/connections/${connectionId}/debug-answer`, {
                method: 'get',
            })

            let body = await response.text();
            if (response.ok && body !== "") {
                this.emitLogEvent(`got answer for connectionId ${connectionId}. setting remote description`);
                let answer = JSON.parse(body);
                this.pluginId = answer?.pluginId;
                this.emitLogEvent(`got plugin id ${this.pluginId}. setting remote description`);
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                this.emitLogEvent("after setting remote description");
                return;
            }
            this.emitLogEvent(`failed to get answer error: ${response.status}, ${body}`)
            // if failed to get positive response, try again in a second
            setTimeout(() => this.getAnswer(connectionId), 1000)
        } catch (e) {
            this.emitLogEvent(e)
        }
    }

    handleConnectionStateChange(event) {
        let newConnectionState;
        switch (this.peerConnection.connectionState) {
            case "connected":
                newConnectionState = connectionStates.CONNECTED;
                break;
            case "disconnected":
            case "failed":
            case "closed":
                newConnectionState = connectionStates.DISCONNECTED;
                break;
            default:
                newConnectionState = connectionStates.PENDING;
        }
    }

    async handleIceCandidate(event) {
        if (this.peerConnection && event.candidate === null) {
            let offer = Object.assign({}, this.peerConnection.localDescription.toJSON());
            offer.deviceId = this.deviceId;
            offer.pluginType = "cso";

            let connectionId = await this.sendOffer(offer);
            if (connectionId) {
                this.connectionId = connectionId;
                this.getAnswer(connectionId);
            }
        }
    }

    handleTrack(event) {
        // console.log("handleTrack", event)
        if (event.track.kind === 'audio') {
            return;
        }
        this.emitLogEvent("got track event " + JSON.stringify(event));
        this.emit(events.STREAM_UPDATE, { src: event.streams[0], type: event.streams[0].id })
    }

    handleDataChannelMessage(event) {
        const { data } = event
        if (!data) {
            return
        }

        // console.log("dataChannelMessage:", data, this.isDataJsonFormat(data));
        this.emitLogEvent(`Message from data channel '${this.dataChannel.label}': ${data}`);
    }

    sendChatMessage(message, width, height) {
        message = message.replace('data:image/png;base64,', '')
        const data = {
            type: "chat",
            width,
            height,
            message,
        }
        console.log(data)
        this.sendDataChannelMessage(JSON.stringify(data))
    }

    sendDataChannelMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === "open") {
            try {
                this.dataChannel.send(message);
                this.emitLogEvent(`Message to data channel '${this.dataChannel.label}': ${message}`);
            }
            catch (e) {
                this.emitLogEvent(`Message to data channel '${this.dataChannel.label}: failed to send message - ${e}`);
            }
        } else {
            this.emitLogEvent("data channel is not open for message " + message)
        }
    }

    async sendOffer(offer) {
        try {
            let connectionId;
            if (!this.connectionId) { // if connection id does not exist, it was not set by user
                // get connectionId by deviceId
                const response = await fetch(`${this.signalingServer}/signaling/1.0/connections?deviceId=${this.deviceId}`, {
                    method: 'get',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                const body = await response.text();
                if (body !== "") {
                    let jsonBody = JSON.parse(body);
                    if (jsonBody.error) {
                        this.emitLogEvent(`failed to get connection id for device ${this.deviceId}: ${body}`);
                        return;
                    }
                    connectionId = JSON.parse(body).connectionId;
                }

                this.emitLogEvent(`got connectionId ${connectionId} from device id ${this.deviceId}`);
            } else {
                connectionId = this.connectionId
                this.emitLogEvent(`connectionId is set. using connectionId ${this.connectionId} instead of deviceId`);
            }

            // send offer to signaling server
            let sendOfferResponse = await fetch(`${this.signalingServer}/signaling/1.0/connections/${connectionId}/debug-offer`, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(offer)
            })

            if (sendOfferResponse.status !== 201) {
                this.emitLogEvent(`error putting debug offer: ${response.statusText}`)
                return;
            }

            const body = await sendOfferResponse.text()

            this.emitLogEvent(`finished posting debug offer. response: ${sendOfferResponse.status} ${body}`);
            return connectionId;
        } catch (e) {
            this.emitLogEvent(`error sending debug offer: ${e.toString()}`)
            return;
        }
    }

    removeListeners(eventName) {
        this.removeAllListeners(eventName)
    }

    disconnect() {
        console.log("closing connection")
        this.removeAllListeners();
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        console.log("connection closed")
    }
}

const WebRtcClient = new Client();
export default WebRtcClient;
