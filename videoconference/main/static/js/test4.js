const roomName = JSON.parse(document.getElementById('room-name').textContent);
const username = JSON.parse(document.getElementById('user-name').textContent);

// TURN Server config
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

// Create socket
const socket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/'
    + roomName
    + '/'
);

// variables

// local video stream
var localStream = new MediaStream();
// remote video stream
let remoteStream = new MediaStream();
// html elements
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');
// variable for receiver
let receiver_channel_name = ""

// map peer usernames to corresponding RTCPeerConnections
// as key value pairs
var mapPeers = {};

// WebRTC connection
// var pc = new RTCPeerConnection(PC_CONFIG);

// Send message to server
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
    getLocalStream();
    console.log('connected', socket.readyState);
    console.log(event)
    sendSignal('new-peer', {});
};

// Get local stream with video and audio but muted
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

// SOCKET ON DATA
socket.onmessage = function(event) {
    console.log('Data received: ', event.data);
    // Handle incoming message
    var parsedData = JSON.parse(event.data);
    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    receiver_channel_name = parsedData['message']['receiver_channel_name']
    
    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    try{
        // ---------
        if (action === 'new-peer') {
            console.log('new-peer: ', peerUsername);
            var pc = new RTCPeerConnection(PC_CONFIG);

            // add a stream sharing
            localStream.getTracks().forEach(track => {
                console.log('Adding localStream tracks.');
                pc.addTrack(track, localStream);
            });

            // add a remote stream
            console.log('Setting ontrack:');
            var remoteStream = new MediaStream();
            remoteStreamElement.srcObject = remoteStream;
            console.log('remoteVideo: ', remoteStreamElement.id);
            pc.addEventListener('track', async (event) => {
                console.log('Adding track: ', event.track);
                remoteStream.addTrack(event.track, remoteStream);
            });

            // save a peer
            mapPeers[peerUsername] = pc;

            // check ICE connection
            pc.oniceconnectionstatechange = () => {
                var iceConnectionState = pc.iceConnectionState;
                if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                    console.log('Deleting peer');
                    delete mapPeers[peerUsername];
                    if(iceConnectionState != 'closed'){
                        pc.close();
                    }
                }
            };

            // on ICE candidate
            pc.onicecandidate = (event) => {
                if(event.candidate){
                    console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                    return;
                }
                // event.candidate == null indicates that gathering is complete
        
                console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
                console.log('receiverChannelName: ', receiver_channel_name);

                // send offer to new peer
                // after ice candidate gathering is complete
                sendSignal('new-offer', {
                    'sdp': pc.localDescription,
                    'receiver_channel_name': receiver_channel_name,
                });
            }

            // creating an offer
            pc.createOffer()
                .then(o => pc.setLocalDescription(o))
                .then(function(event){
                    console.log("Local Description Set successfully.");
                });

            return;
        }

        // ----------------------
        if (action == 'new-offer') {
            console.log('new-offer from: ', peerUsername);

            var offer = parsedData['message']['sdp'];
            console.log('Offer: ', offer);

            var pc = new RTCPeerConnection(PC_CONFIG);

            // add a stream sharing
            localStream.getTracks().forEach(track => {
                console.log('Adding localStream tracks.');
                pc.addTrack(track, localStream);
            });

            // add a remote stream
            console.log('Setting ontrack:');
            var remoteStream = new MediaStream();
            remoteStreamElement.srcObject = remoteStream;
            console.log('remoteVideo: ', remoteStreamElement.id);
            pc.addEventListener('track', async (event) => {
                console.log('Adding track: ', event.track);
                remoteStream.addTrack(event.track, remoteStream);
            });

            // check ICE connection
            pc.oniceconnectionstatechange = () => {
                var iceConnectionState = pc.iceConnectionState;
                if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                    console.log('Deleting peer');
                    if(iceConnectionState != 'closed'){
                        pc.close();
                    }
                }
            };

            // on ICE candidate
            pc.onicecandidate = (event) => {
                if(event.candidate){
                    console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                    return;
                }
                // event.candidate == null indicates that gathering is complete
        
                console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
                console.log('receiverChannelName: ', receiver_channel_name);

                // send answer to offering peer
                // after ice candidate gathering is complete
                sendSignal('new-answer', {
                    'sdp': pc.localDescription,
                    'receiver_channel_name': receiver_channel_name,
                });
            }

            pc.setRemoteDescription(offer)
                .then(() => {
                    console.log('Set offer from %s.', peerUsername);
                    return pc.createAnswer();
                })
                .then(a => {
                    console.log('Setting local answer for %s.', peerUsername);
                    return pc.setLocalDescription(a);
                })
                .then(() => {
                    console.log('Answer created for %s.', peerUsername);
                })
                .catch(error => {
                    console.log('Error creating answer for %s.', peerUsername);
                    console.log(error);
                });

            return;
        }
        // -----------------------
        if (action == 'new-answer'){
            console.log(peerUsername)
            var pc = mapPeers[peerUsername];

            // get the answer
            var answer = parsedData['message']['sdp'];

            console.log('mapPeers:');
            for(key in mapPeers){
                console.log(key, ': ', mapPeers[key]);
            }

            console.log('peer: ', pc);
            console.log('answer: ', answer);

            // set remote description of the RTCPeerConnection
            pc.setRemoteDescription(answer);

            return;
        }
        
    } catch (err) {
        console.error(err);
    }
};

// SOCKET ON CLOSE
socket.onclose = function(event) {
    console.error('Chat socket closed unexpectedly', event);
};

// buttons for micro and video on/off
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
        } else if(button.id == 2){
            let vidTrack = localStream.getVideoTracks()[0];
            vidTrack.enabled = !vidTrack.enabled;
            let vidStatus = vidTrack.enabled ? "unmuted" : "muted";
            console.log(vidStatus);
            content.innerHTML = '<rect x="29.3924" y="15.3924" width="41.4251" height="32.5483" rx="2.60756" stroke="white" stroke-width="2.78488"/><path d="M70.9916 23.8895C70.9916 23.6252 71.1624 23.3913 71.414 23.3108L79.0757 20.8604C79.4678 20.735 79.8684 21.0275 79.8684 21.439V42.0684C79.8684 42.48 79.4678 42.7725 79.0757 42.6471L71.414 40.1966C71.1624 40.1161 70.9916 39.8822 70.9916 39.618V23.8895Z" stroke="white" stroke-width="2.78488"/>';
            button.style.background = '#959595';
        } else {
            console.log("exit");
            button.style.background = '#DB392E';
        }
    } else if(button.classList.contains("ON")){
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
        } else if(button.id == 2){
            let vidTrack = localStream.getVideoTracks()[0];
            vidTrack.enabled = !vidTrack.enabled;
            let vidStatus = vidTrack.enabled ? "unmuted" : "muted";
            console.log(vidStatus);
            content.innerHTML = '<rect x="29.2838" y="15.6049" width="41.1356" height="32.3208" rx="1.69493" stroke="white" stroke-width="2.76542"/><path d="M70.5924 23.7161C70.5924 23.6482 70.6363 23.588 70.701 23.5674L79.2035 20.848C79.3043 20.8158 79.4072 20.8909 79.4072 20.9967V42.7069C79.4072 42.8127 79.3043 42.8879 79.2035 42.8556L70.701 40.1363C70.6363 40.1156 70.5924 40.0555 70.5924 39.9876V23.7161Z" stroke="white" stroke-width="2.76542"/><path d="M26 55.7035L73.7035 8" stroke="white" stroke-width="2.76542" stroke-linecap="round" stroke-linejoin="round"/>';
            button.style.background = '#777777';
        } else {
            console.log("exit");
            button.style.background = '#C42C22';
        }
    }
};
