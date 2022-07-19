const EventEmitter = require('events');

const dataChannelOptions = {
    ordered: true, // do not guarantee order
    maxPacketLifeTime: 3000, // in milliseconds
};

const AUTHN_SERVER = "https://authn.ingress.hyperscale.coldsnow.net"
const AUTHZ_SERVER = "https://authz.ingress.hyperscale.coldsnow.net"
const SIGNALING_SERVER = "https://signaling.ingress.hyperscale.coldsnow.net"

const FCID = () => Math.round(Math.random() * 1000000).toString()


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
        this.accessToken = undefined;

        this.initialize = this.initialize.bind(this);
        this.getAccessToken = this.getAccessToken.bind(this);

        this.emitConnectionStatusMessage = this.emitConnectionStatusMessage.bind(this);
        this.emitConnectedEvent = this.emitConnectedEvent.bind(this);
        this.emitDisconnectEvent = this.emitDisconnectEvent.bind(this);

        this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
        this.handleIceCandidate = this.handleIceCandidate.bind(this);

        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.sendDataChannelMessage = this.sendDataChannelMessage.bind(this);
        this.sendOffer = this.sendOffer.bind(this);

        this.removeListeners = this.removeListeners.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    initialize(deviceId, connectionId, signalingServer, useStun) {
        this.emitConnectionStatusMessage('trying to connect')
        this.deviceId = deviceId;
        this.connectionId = connectionId
        this.signalingServer = SIGNALING_SERVER;
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
    }

    async getAnswer(connectionId) {
        try {
            console.log("trying to get answer..");

            let response = await fetch(`${this.signalingServer}/signaling/1.0/connections/${connectionId}/debug-answer`, {
                method: 'get',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    flow_context: FCID()
                }
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

    async getAccessToken() {
        this.emitConnectionStatusMessage('getting access token')
        console.log(`Enabling authentication flow to get access token for device: ${this.deviceId}`);

        const authnUrl = `${AUTHN_SERVER}/authn/v1/client_assertion/${this.deviceId}`;
        const authzUrl = `${AUTHZ_SERVER}/authz/v1/token`;
        const fcid = FCID();

        // start auth device flow
        console.log(`Get client_assertion from authn: ${authnUrl}`);
        const authnResponse = await fetch(authnUrl, {
            method: 'get',
            headers: {
                flow_context: `${fcid}_authn`,
            }
        })
        if (authnResponse.status !== 200) {
            console.log(`unable to get client assertion from authn`, true)
            console.error(`unable to get client assertion from authn status: ${authnResponse.status} response: ${authnResponse}`)
            return
        }
        const authnResponseBody = await authnResponse.json();
        const clientAssertion = authnResponseBody.client_assertion;
        if (!clientAssertion) {
            console.log(`response from authn does not include client_assertion`, true)
            console.error(`unable to get client assertion from authn status: ${authnResponse.status} response: ${authnResponseBody}`)
            return
        }

        console.log(`get access token from authz: ${authzUrl}`);

        let authzResponse = await fetch(authzUrl, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                flow_context: `${fcid}_authz`,
            },
            body: new URLSearchParams({
                'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion': clientAssertion
            })
        })
        if (authzResponse.status !== 200) {
            console.log(`unable to get access token from authz`, true)
            console.error(`unable to get access token from authz status: ${authzResponse.status} response: ${authzResponse}`)
            return
        }
        const authzResponseBody = await authzResponse.json();
        this.accessToken = authzResponseBody.access_token;
        if (!this.accessToken) {
            this.emitConnectionStatusMessage("could not find access token", true)
            console.log(`response from authz does not include access_token`, true)
            console.error(`unable to get access token from authz status: ${authzResponse.status} response: ${authzResponseBody}`)
            return
        }
    }

    handleConnectionStateChange(event) {
        let newConnectionState;
        let connectionEnd = false;
        switch (this.peerConnection.connectionState) {
            case "connected":
                newConnectionState = "CONNECTED";
                this.emitConnectedEvent();
                break;
            case "disconnected":
            case "failed":
            case "closed":
                newConnectionState = "DISCONNECTED";
                connectionEnd = true
                break;
            case "connecting":
                newConnectionState = "CONNECTING";
                break;
            default:
                newConnectionState = "PENDING";
                break;

        }
        this.emitConnectionStatusMessage(`CONNECTION CHANGED TO ${newConnectionState}`, connectionEnd)
        if (connectionEnd) {
            this.emitDisconnectEvent();
        }

        console.log(`connection state changed to ${newConnectionState}`)
    }

    async handleIceCandidate(event) {
        if (this.peerConnection && event.candidate === null) {
            let offer = Object.assign({}, this.peerConnection.localDescription.toJSON());
            offer.deviceId = this.deviceId;
            offer.pluginType = "remote-control";

            await this.getAccessToken();

            let connectionId = await this.sendOffer(offer);
            if (connectionId) {
                this.connectionId = connectionId;
                this.emitConnectionStatusMessage('trying to get an answer')
                this.getAnswer(connectionId);
            }
        }
    }

    sendChatMessage(message, width, height, duration = 4000) {
        message = message.replace('data:image/png;base64,', '')
        const data = {
            type: "chat",
            width,
            height,
            message,
            duration
        }
        console.log(data)
        this.sendDataChannelMessage(JSON.stringify(data))
    }

    sendDataChannelMessage(message) {
        if (this.dataChannel && this.dataChannel.readyState === "open") {
            try {
                this.dataChannel.send(message);
                // console.log(`Message to data channel '${this.dataChannel.label}': ${message}`);
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
            this.emitConnectionStatusMessage('finding your connection')
            let connectionId;
            // get connectionId by deviceId
            const response = await fetch(`${SIGNALING_SERVER}/signaling/1.0/connections?deviceId=${this.deviceId}`, {
                method: 'get',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    flow_context: FCID()
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
                    'Authorization': `Bearer ${this.accessToken}`,
                    flow_context: FCID()
                },
                body: JSON.stringify(offer)
            })

            if (sendOfferResponse.status !== 201) {
                console.log(`error putting debug offer: ${sendOfferResponse.statusText}`)
                return;
            }

            body = await sendOfferResponse.text()

            this.emitConnectionStatusMessage('posted debug offer')

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

    emitConnectionStatusMessage(message, interrupt = false) {
        this.emit('CONNECTION_STATUS_MESSAGE', message)
        if (interrupt) {
            this.emitDisconnectEvent()
        }
    }
    emitConnectedEvent() {
        this.emit('CONNECTED', "")
    }
    emitDisconnectEvent() {
        this.emit('DISCONNECT', "")
    }

    disconnect() {
        console.log("closing connection")
        this.emitConnectionStatusMessage('closing connection', true)
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
