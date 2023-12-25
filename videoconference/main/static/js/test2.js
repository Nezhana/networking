
const roomName = JSON.parse(document.getElementById('room-name').textContent);
const username = JSON.parse(document.getElementById('user-name').textContent);

const TURN_SERVER_URL = 'a.relay.metered.ca:80';
const TURN_SERVER_USERNAME = '20edc1b5a1145664741ce56c';
const TURN_SERVER_CREDENTIAL = '2faxuT5nJ6brAAI+';

const PC_CONFIG = {
    iceServers: [
    {
        urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
        username: TURN_SERVER_USERNAME,
        credential: TURN_SERVER_CREDENTIAL
    },
    {
        urls: 'turn:' + TURN_SERVER_URL + '?transport=udp',
        username: TURN_SERVER_USERNAME,
        credential: TURN_SERVER_CREDENTIAL
    }
    ]
};

const socket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/main/'
    + roomName
    + '/'
);

// variables
// var username = 'test_user'
var mapPeers = {}; // map peer usernames to corresponding RTCPeerConnections as key value pairs
var mapScreenPeers = {}; // peers that stream own screen to remote peers
var screenShared = false; // true if screen is being shared false otherwise
// let localStream;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');

// local video stream
var localStream = new MediaStream();

function sendSignal(action, message){
    socket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

// SOCKET ON OPEN
socket.onopen = function(event) {
    console.log('connected', socket.readyState);
    console.log(event)
    sendSignal('new-peer', {
        'local_screen_sharing': false,
    });
    // createPeerConnection();
    // sendOffer();
};

// SOCKET ON OPEN: PART 1
let createPeerConnection = (peerUsername, receiver_channel_name) => {
    try {
        // pc = new RTCPeerConnection(PC_CONFIG);
        pc = new RTCPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
            }
            console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
            sendSignal('new-offer', {
                'sdp': pc.localDescription,
                'receiver_channel_name': receiver_channel_name,
            });
            // pc.addIceCandidate(new RTCIceCandidate(event.candidate));
        };

        pc.ontrack = onTrack;
        // pc.addStream(localStream);

        // localStream.getTracks().forEach((track) => {
        //     pc.addTrack(track, localStream);
        // });
        pc.addStream(localStream);

        console.log('PeerConnection created');
    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

// SOCKET ON OPEN: PART 1.1
let onTrack = (event) => {
    console.log('Adding track: ', event.track);
    remoteStreamElement.srcObject = event.streams[0];
};

// SOCKET ON OPEN: PART 2
let sendOffer = () => {
    console.log('Send offer');
    pc.createOffer()
            .then(o => pc.setLocalDescription(o))
            .then(function(event){
                console.log("Local Description Set successfully.");
        });
};

// SOCKET ON DATA: PART new-offer
let sendAnswer = (offer, peerUsername) => {
    console.log('Send answer');
    if (pc.signalingState === "stable") {
        // Call setRemoteDescription only when the connection is in the "stable" state
        console.log(offer)
        pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
                // pc.setRemoteDescription(new RTCSessionDescription(offer))
                console.log('Set offer from %s.', peerUsername);
                return pc.createAnswer();
            })
            .then(a => {
                console.log('Setting local answer for %s.', peerUsername);
                return pc.setLocalDescription(a);
            })
            .then(() => {
                console.log('Answer created for %s.', peerUsername);
                console.log('localDescription: ', pc.localDescription);
                console.log('remoteDescription: ', pc.remoteDescription);
            })
            .catch(error => {
                console.log('Error creating answer for %s.', peerUsername);
                console.log(error);
            });
            // .catch(error => {
            //     console.log('Error setting remote description:', error);
            // });
    } else {
        console.log('Cannot set remote description in the current state:', pc.signalingState);
    }
    
};

// SOCKET ON DATA
socket.onmessage = function(event) {
    // let data = event.data;
    console.log('Data received: ', event.data);

    var parsedData = JSON.parse(event.data);
    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    var receiver_channel_name = parsedData['message']['receiver_channel_name']

    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    // in case of new peer
    if(action == 'new-peer'){
        console.log('--------------------------------')
        console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createPeerConnection(peerUsername, receiver_channel_name);
        sendOffer();
        return;
    }

    if(action == 'new-offer'){
        console.log('--------------------------------')
        console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        createPeerConnection(peerUsername, receiver_channel_name);
        // pc.setRemoteDescription(new RTCSessionDescription(event.data));
        console.log(parsedData)
        sendAnswer(parsedData['message']['sdp'], peerUsername);
        return;
    }

    if(action == 'new-answer'){
        console.log('--------------------------------')
        // --------------
        pc = new RTCPeerConnection();
        pc.ontrack = onTrack;
        pc.addStream(localStream);
        // --------------

        // get the answer
        var answer = parsedData['message']['sdp'];

        console.log('peer: ', pc);
        console.log('answer: ', answer);

        // set remote description of the RTCPeerConnection
        if (pc.signalingState === "stable") {
            // Call setRemoteDescription only when the connection is in the "stable" state
            pc.setRemoteDescription(new RTCSessionDescription(answer))
                .then(() => {
                    // pc.setRemoteDescription(new RTCSessionDescription(answer));
                })
                .catch(error => {
                    console.log('Error setting remote description:', error);
                });
        } else {
            console.log('Cannot set remote description in the current state:', pc.signalingState);
        }

        return;
    }

};

// let sendData = (data) => {
//     console.log(data)
//     socket.send(JSON.stringify(data));
// };

// SOCKET On CLOSE
socket.onclose = function(event) {
    console.error('Chat socket closed unexpectedly');
};

let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;
            // Disable the microphone and video by default
            stream.getAudioTracks()[0].enabled = false;
            stream.getVideoTracks()[0].enabled = false;
            localStreamElement.srcObject = localStream;
            window.stream = stream; // make variable available to browser console
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}

function toggle(button) {
    var content = button.querySelector("svg")
        if(button.classList.contains("OFF")){
            button.classList.remove("OFF");
            button.classList.add("ON");
            console.log(button.id, button.classList, content);
            if(button.id == 1){
                let micTrack = localStream.getAudioTracks()[0];
                micTrack.enabled = !micTrack.enabled;
                let micStatus = micTrack.enabled ? "unmuted" : "muted";
                console.log(micStatus);
                content.innerHTML = '<rect x="44.2716" y="10" width="15.6067" height="27.7798" rx="7.80333" stroke="white" stroke-width="2.8092"/><path d="M36.0001 31.8492C36.0001 40.745 43.5693 47.3779 51.6068 47.3779C58.7858 47.3779 67.5256 42.3057 67.5256 31.8492" stroke="white" stroke-width="2.49706" stroke-linecap="round" stroke-linejoin="round"/><path d="M51.7627 54.2449V47.9242" stroke="white" stroke-width="2.49706" stroke-linecap="round" stroke-linejoin="round"/>';
                button.style.background = '#959595';
            }
            else if(button.id == 2){
                let vidTrack = localStream.getVideoTracks()[0];
                vidTrack.enabled = !vidTrack.enabled;
                let vidStatus = vidTrack.enabled ? "unmuted" : "muted";
                console.log(vidStatus);
                content.innerHTML = '<rect x="29.3924" y="15.3924" width="41.4251" height="32.5483" rx="2.60756" stroke="white" stroke-width="2.78488"/><path d="M70.9916 23.8895C70.9916 23.6252 71.1624 23.3913 71.414 23.3108L79.0757 20.8604C79.4678 20.735 79.8684 21.0275 79.8684 21.439V42.0684C79.8684 42.48 79.4678 42.7725 79.0757 42.6471L71.414 40.1966C71.1624 40.1161 70.9916 39.8822 70.9916 39.618V23.8895Z" stroke="white" stroke-width="2.78488"/>';
                button.style.background = '#959595';
            }
            else {
                console.log("exit");
                button.style.background = '#DB392E';
            }
        }
    
        else if(button.classList.contains("ON")){
            button.classList.remove("ON");
            button.classList.add("OFF");
            console.log(button.id, button.classList, content);
            if(button.id == 1){
                let micTrack = localStream.getAudioTracks()[0];
                micTrack.enabled = !micTrack.enabled;
                let micStatus = micTrack.enabled ? "unmuted" : "muted";
                console.log(micStatus);
                content.innerHTML = '<rect x="44.2716" y="10" width="15.6067" height="27.7798" rx="7.80333" stroke="white" stroke-width="2.8092"/><path d="M36.0001 31.8492C36.0001 40.745 43.5693 47.3779 51.6068 47.3779C58.7858 47.3779 67.5256 42.3057 67.5256 31.8492" stroke="white" stroke-width="2.49706" stroke-linecap="round" stroke-linejoin="round"/><path d="M51.7627 54.2449V47.9242" stroke="white" stroke-width="2.49706" stroke-linecap="round" stroke-linejoin="round"/><path d="M30.8976 47.2491L70.1467 8" stroke="white" stroke-width="2.51195" stroke-linecap="round" stroke-linejoin="round"/>';
                button.style.background = '#777777';
            }
            else if(button.id == 2){
                let vidTrack = localStream.getVideoTracks()[0];
                vidTrack.enabled = !vidTrack.enabled;
                let vidStatus = vidTrack.enabled ? "unmuted" : "muted";
                console.log(vidStatus);
                content.innerHTML = '<rect x="29.2838" y="15.6049" width="41.1356" height="32.3208" rx="1.69493" stroke="white" stroke-width="2.76542"/><path d="M70.5924 23.7161C70.5924 23.6482 70.6363 23.588 70.701 23.5674L79.2035 20.848C79.3043 20.8158 79.4072 20.8909 79.4072 20.9967V42.7069C79.4072 42.8127 79.3043 42.8879 79.2035 42.8556L70.701 40.1363C70.6363 40.1156 70.5924 40.0555 70.5924 39.9876V23.7161Z" stroke="white" stroke-width="2.76542"/><path d="M26 55.7035L73.7035 8" stroke="white" stroke-width="2.76542" stroke-linecap="round" stroke-linejoin="round"/>';
                button.style.background = '#777777';
            }
            else {
                console.log("exit");
                button.style.background = '#C42C22';
            }
        }
    };

// Start connection
getLocalStream();