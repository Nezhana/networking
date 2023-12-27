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

// local video stream
var localStream = new MediaStream();

// local screen stream
// for screen sharing
// var localDisplayStream = new MediaStream();

let remoteStream = new MediaStream();
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');

let receiver_channel_name = ""

// var pc = new RTCPeerConnection(PC_CONFIG);
var pc = new RTCPeerConnection();

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

// pc.onicecandidate = (event) => {
//     if (event.candidate) {
//         // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
//         console.log("New Ice Candidate! " + event.candidate);
//     }
//     sendSignal('candidate', {'candidate': event.candidate});
// };

// let negotiating = false;
// pc.onnegotiationneeded = async e => {
//     try {
//         if (negotiating || pc.signalingState != "stable") return;
//         negotiating = true;
//         await pc.setLocalDescription(await pc.createOffer());
//         sendSignal('new-offer', {
//             'sdp': pc.localDescription,
//             'receiver_channel_name': receiver_channel_name,
//         });
//     } finally {
//         negotiating = false;
//     }
// };

// pc.onnegotiationneeded = async () => {
//     try {
//         await pc.setLocalDescription(await pc.createOffer());
//         sendSignal('new-offer', {
//             'sdp': pc.localDescription,
//             'receiver_channel_name': receiver_channel_name,
//         });
//     } catch (err) {
//         console.error(err);
//     }
// };

function setOnTrack(pc){
    console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteStreamElement.srcObject = remoteStream;

    pc.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}

// SOCKET ON DATA
socket.onmessage = async function(event) {
    console.log('Data received: ', event.data);

    var parsedData = JSON.parse(event.data);
    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];
    receiver_channel_name = parsedData['message']['receiver_channel_name']
    
    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    // if(peerUsername == username){
    //     // ignore all messages from oneself
    //     return;
    // }

    // from,
    // desc,
    // candidate
    // $('#remote').val(from);

    try {
        // if we get an offer, we need to reply with an answer
        if (action === 'new-offer') {
            var pc = new RTCPeerConnection();

            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            pc.ontrack = async (event) => {
                // don't set srcObject again if it is already set.
                console.log('remoteStreamElement.srcObject: ', remoteStreamElement.srcObject);
                if (remoteStreamElement.srcObject) return;
                console.log('Adding track: ', event.track);
                remoteStreamElement.srcObject = event.streams[0];
                // remoteStream.addTrack(event.track, remoteStream);
            };

            var desc = parsedData['message']['sdp'];

            // const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            // stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            // localStreamElement.srcObject = stream;
            // pc.addStream(localStream);

            // setOnTrack(pc);
            // remoteStream.getTracks().forEach((track) => pc.addTrack(track, remoteStream));
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                    console.log("New Ice Candidate! " + event.candidate);
                    
                }
                // sendSignal('candidate', {'candidate': event.candidate});
            };
            sendSignal('new-answer', {
                'sdp': pc.localDescription,
                'receiver_channel_name': receiver_channel_name,
                });
            await pc.setRemoteDescription(desc);
            
            await pc.setLocalDescription(await pc.createAnswer());
            console.log(pc.localDescription);

            console.log('Answer created for %s.', peerUsername);
            console.log('localDescription: ', pc.localDescription);
            console.log('remoteDescription: ', pc.remoteDescription);
            return;
        } else if (action === 'new-peer') {
            var pc = new RTCPeerConnection();
            // pc.addStream(localStream);
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
            pc.ontrack = async (event) => {
                // don't set srcObject again if it is already set.
                console.log('remoteStreamElement.srcObject: ', remoteStreamElement.srcObject);
                if (remoteStreamElement.srcObject) return;
                console.log('Adding track: ', event.track);
                remoteStreamElement.srcObject = event.streams[0];
                // remoteStream.addTrack(event.track, remoteStream);
            };
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                    console.log("New Ice Candidate! " + event.candidate);
                }
                // connect();
                // sendSignal('candidate', {'candidate': event.candidate});
            };
            connect();
            return;
        } else if (action === 'new-answer') {
            var pc = new RTCPeerConnection();
            var desc = parsedData['message']['sdp'];
            await pc.setRemoteDescription(desc).catch(err => console.log(err));
            return;
        } else if (action === 'candidate') {
            var pc = new RTCPeerConnection();
            var candidate = parsedData['message']['candidate'];
            await pc.addIceCandidate(candidate).catch(err => console.log(err));
            sendSignal('new-offer', {
                'sdp': pc.localDescription,
                'receiver_channel_name': receiver_channel_name,
            });
            return;
        } else {
            console.log('Unsupported SDP type.');
            return;
        }
    } catch (err) {
            console.error(err);
    }
};


async function start() {
    try {
        // get local stream, show it in self-view and add it to be sent
        const stream = await requestUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        attachMediaStream(localStreamElement, stream);
    } catch (err) {
        console.error(err);
    }
}

// socket.on('id', (data) => {
//     $('#myid').text(data.id);
// });


// this function is called once the caller hits connect after inserting the unique id of the callee
async function connect() {
    try {
        sendSignal('new-offer', {
            'sdp': pc.localDescription,
            'receiver_channel_name': receiver_channel_name,
            });
        await pc.setLocalDescription(await pc.createOffer());
    } catch (err) {
        console.error(err);
    }
}

// SOCKET ON OPEN
socket.onopen = function(event) {
    getLocalStream();
    console.log('connected', socket.readyState);
    console.log(event)
    // connect();
    sendSignal('new-peer', {});
    // createPeerConnection();
    // sendOffer();
};

// SOCKET ON CLOSE
socket.onclose = function(event) {
    console.error('Chat socket closed unexpectedly', event);
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