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

        this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
        this.handleIceCandidate = this.handleIceCandidate.bind(this);

        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.sendDataChannelMessage = this.sendDataChannelMessage.bind(this);
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
            console.log('dataChannel has opened')
        }
        this.dataChannel.onclose = () => console.log('dataChannel has closed')

        this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange
        this.peerConnection.onicecandidate = this.handleIceCandidate
        this.peerConnection.createOffer().then(d => this.peerConnection.setLocalDescription(d)).catch(console.log);
        // console.log(this.peerConnection);
    }

    async getAnswer(connectionId) {
        try {
            console.log("trying to get answer..");

            let response = await fetch(`${this.signalingServer}/signaling/1.0/connections/${connectionId}/debug-answer`, {
                method: 'get',
            })

            let body = await response.text();
            if (response.ok && body !== "") {
                console.log(`got answer for connectionId ${connectionId}. setting remote description`);
                let answer = JSON.parse(body);
                this.pluginId = answer?.pluginId;
                console.log(`got plugin id ${this.pluginId}. setting remote description`);
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("after setting remote description");
                return;
            }
            console.log(`failed to get answer error: ${response.status}, ${body}`)
            // if failed to get positive response, try again in a second
            setTimeout(() => this.getAnswer(connectionId), 1000)
        } catch (e) {
            console.log(e)
        }
    }

    handleConnectionStateChange(event) {
        let newConnectionState;
        switch (this.peerConnection.connectionState) {
            case "connected":
                newConnectionState = "CONNECTED";
                break;
            case "disconnected":
            case "failed":
            case "closed":
                newConnectionState = "DISCONNECTED";
                break;
            default:
                newConnectionState = "PENDING";
        }
        console.log(`connection state changed to ${newConnectionState}`)
    }

    async handleIceCandidate(event) {
        if (this.peerConnection && event.candidate === null) {
            let offer = Object.assign({}, this.peerConnection.localDescription.toJSON());
            offer.deviceId = this.deviceId;
            offer.pluginType = "remote-control";

            let connectionId = await this.sendOffer(offer);
            if (connectionId) {
                this.connectionId = connectionId;
                this.getAnswer(connectionId);
            }
        }
    }

    sendChatMessage(message, width, height) {
        message = message.replace('data:image/png;base64,', '')
        const data = {
            type: "chat",
            width,
            height,
            message,
            duration: 4000
        }
        console.log(data)
        this.sendDataChannelMessage(JSON.stringify(data))
    }

    sendDataChannelMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === "open") {
            try {
                this.dataChannel.send(message);
                console.log(`Message to data channel '${this.dataChannel.label}': ${message}`);
            }
            catch (e) {
                console.log(`Message to data channel '${this.dataChannel.label}: failed to send message - ${e}`);
            }
        } else {
            console.log("data channel is not open for message " + message)
        }
    }

    async sendOffer(offer) {
        try {
            let connectionId;
            // get connectionId by deviceId
            const response = await fetch(`${this.signalingServer}/signaling/1.0/connections?deviceId=${this.deviceId}`, {
                method: 'get',
                headers: {
                    'Accept': 'application/json'
                }
            });
            let body = await response.text();
            if (body !== "") {
                let jsonBody = JSON.parse(body);
                if (jsonBody.error) {
                    console.log(`failed to get connection id for device ${this.deviceId}: ${body}`);
                    return;
                }
                connectionId = JSON.parse(body).connectionId;
            }

            console.log(`got connectionId ${connectionId} from device id ${this.deviceId}`);

            // send offer to signaling server
            let sendOfferResponse = await fetch(`${this.signalingServer}/signaling/1.0/connections/${connectionId}/debug-offer`, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(offer)
            })

            if (sendOfferResponse.status !== 201) {
                console.log(`error putting debug offer: ${sendOfferResponse.statusText}`)
                return;
            }

            body = await sendOfferResponse.text()

            console.log(`finished posting debug offer. response: ${sendOfferResponse.status} ${body}`);
            return connectionId;
        } catch (e) {
            console.log(`error sending debug offer: ${e.toString()}`)
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
