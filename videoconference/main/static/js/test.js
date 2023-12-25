
const roomName = JSON.parse(document.getElementById('room-name').textContent);

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
var username = 'test_user'
var mapPeers = {}; // map peer usernames to corresponding RTCPeerConnections as key value pairs
var mapScreenPeers = {}; // peers that stream own screen to remote peers
var screenShared = false; // true if screen is being shared false otherwise
// let localStream;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');

// local video stream
var localStream = new MediaStream();

socket.onopen = function(event) {
    console.log('connected', socket.readyState);
    console.log(event)
    sendSignal('new-peer', {
        'local_screen_sharing': false,
    });
    // createPeerConnection();
    // sendOffer();
};

socket.onmessage = function(event) {
    // let data = event.data;
    console.log('Data received: ', event.data);

    var parsedData = JSON.parse(event.data);
    var action = parsedData['action'];
    // username of other peer
    var peerUsername = parsedData['peer'];

    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    // if(peerUsername == username){
    //     // ignore all messages from oneself
    //     return;
    // }

    // boolean value specified by other peer
    // indicates whether the other peer is sharing screen
    var remoteScreenSharing = parsedData['message']['local_screen_sharing'];
    console.log('remoteScreenSharing: ', remoteScreenSharing);

    // channel name of the sender of this message
    // used to send messages back to that sender
    // hence, receiver_channel_name
    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    console.log('receiver_channel_name: ', receiver_channel_name);

    // in case of new peer
    if(action == 'new-peer'){
        console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createOfferer(peerUsername, false, remoteScreenSharing, receiver_channel_name);
        // createPeerConnection(peerUsername, false, remoteScreenSharing, receiver_channel_name);

        if(screenShared && !remoteScreenSharing){
            // if local screen is being shared
            // and remote peer is not sharing screen
            // send offer from screen sharing peer
            console.log('Creating screen sharing offer.');
            createOfferer(peerUsername, true, remoteScreenSharing, receiver_channel_name);
        }
        
        return;
    }

    // remote_screen_sharing from the remote peer
    // will be local screen sharing info for this peer
    var localScreenSharing = parsedData['message']['remote_screen_sharing'];

    if(action == 'new-offer'){
        console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        // set offer as remote description
        var offer = parsedData['message']['sdp'];
        console.log('Offer: ', offer);
        var pc = createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name);

        return;
    }

    if(action == 'new-answer'){
        // in case of answer to previous offer
        // get the corresponding RTCPeerConnection
        var pc = null;
        
        if(remoteScreenSharing){
            // if answerer is screen sharer
            pc = mapPeers[peerUsername + ' Screen'][0];
        }else if(localScreenSharing){
            // if offerer was screen sharer
            pc = mapScreenPeers[peerUsername][0];
        }else{
            // if both are non-screen sharers
            pc = mapPeers[peerUsername][0];
        }

        // get the answer
        var answer = parsedData['message']['sdp'];
        
        console.log('mapPeers:');
        for(key in mapPeers){
            console.log(key, ': ', mapPeers[key]);
        }

        console.log('peer: ', pc);
        console.log('answer: ', answer);

        // set remote description of the RTCPeerConnection
        pc.setRemoteDescription(new RTCSessionDescription(answer));

        return;
    }

    // handleSignalingData(data);
};

let sendData = (data) => {
    console.log(data)
    socket.send(JSON.stringify(data));
};

socket.onclose = function(event) {
    console.error('Chat socket closed unexpectedly');
};


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

let getLocalStream = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
            console.log('Stream found');
            localStream = stream;
            // Disable the microphone and video by default
            stream.getAudioTracks()[0].enabled = false;
            stream.getVideoTracks()[0].enabled = false;
            localStreamElement.srcObject = localStream;
        })
        .catch(error => {
            console.error('Stream not found: ', error);
        });
}

function createOfferer(peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name){
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // console.log('ICE candidate');
                console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                // sendData({
                // type: 'candidate',
                // candidate: event.candidate
                // });
            }
            console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
            sendSignal('new-offer', {
                'sdp': pc.localDescription,
                'receiver_channel_name': receiver_channel_name,
                'local_screen_sharing': localScreenSharing,
                'remote_screen_sharing': remoteScreenSharing,
            });
        };

        // pc.ontrack = (event) => {
        //     console.log('Add track');
        //     remoteStreamElement.srcObject = event.streams[0];
        // };

        // pc.addStream(localStream);

        // --------
        addLocalTracks(pc, localScreenSharing);
        setOnTrack(pc, remoteStreamElement);
        console.log('Remote video source: ', localStream.srcObject);
        mapPeers[peerUsername] = [pc, pc];
        // ----------

        console.log('PeerConnection created');

        console.log('Send offer');
        pc.createOffer()
            .then(o => pc.setLocalDescription(o))
            .then(function(event){
                console.log("Local Description Set successfully.");
        });

        console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);

        return pc;

    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

function createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name){
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // console.log('ICE candidate');
                console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(pc.localDescription));
                // sendData({
                // type: 'candidate',
                // candidate: event.candidate
                // });
            }
            console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.');
            sendSignal('new-answer', {
                'sdp': pc.localDescription,
                'receiver_channel_name': receiver_channel_name,
                'local_screen_sharing': localScreenSharing,
                'remote_screen_sharing': remoteScreenSharing,
            });
        };

        // pc.ontrack = (event) => {
        //     console.log('Add track');
        //     remoteStreamElement.srcObject = event.streams[0];
        // };

        // pc.addStream(localStream);
        // console.log('PeerConnection created');

        // -----------
        addLocalTracks(pc, localScreenSharing);
        setOnTrack(pc, remoteStreamElement);
        // --------------

        console.log('Send answer');
        pc.setRemoteDescription(new RTCSessionDescription(offer))
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
            console.log('localDescription: ', pc.localDescription);
            console.log('remoteDescription: ', pc.remoteDescription);
        })
        .catch(error => {
            console.log('Error creating answer for %s.', peerUsername);
            console.log(error);
        });

        return pc;

    } catch (error) {
        console.error('PeerConnection failed: ', error);
    }
};

function addLocalTracks(pc, localScreenSharing){

    localStream.getTracks().forEach(track => {
        console.log('Adding localStream tracks.');
        pc.addTrack(track, localStream);
    });

    // localDisplayStream.getTracks().forEach(track => {
    //     console.log('Adding localDisplayStream tracks.');
    //     pc.addTrack(track, localDisplayStream);
    // });
}

function setOnTrack(pc, remoteVideo){
    console.log('Setting ontrack:');
    // create new MediaStream for remote tracks
    var remoteStream = new MediaStream();

    // assign remoteStream as the source for remoteVideo
    remoteVideo.srcObject = remoteStream;

    console.log('remoteVideo: ', remoteVideo.id);

    pc.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
};

// ---------------------------

// document.querySelector('#chat-message-input').focus();
// document.querySelector('#chat-message-input').onkeyup = function(e) {
//     if (e.keyCode === 13) {  // enter, return
//         document.querySelector('#chat-message-submit').click();
//     }
// };

// document.querySelector('#chat-message-submit').onclick = function(e) {
//     const messageInputDom = document.querySelector('#chat-message-input');
//     const message = messageInputDom.value;
//     chatSocket.send(JSON.stringify({
//         'message': message
//     }));
//     messageInputDom.value = '';
// };

// -----------------

// WebRTC methods
// let pc;
// let localStream;
// let remoteStreamElement = document.querySelector('#remoteStream');
// let localStreamElement = document.querySelector('#localStream');

// let getLocalStream = () => {
//     navigator.mediaDevices.getUserMedia({ audio: true, video: true })
//         .then((stream) => {
//             console.log('Stream found');
//             localStream = stream;
//             // Disable the microphone and video by default
//             stream.getAudioTracks()[0].enabled = false;
//             stream.getVideoTracks()[0].enabled = false;
//             localStreamElement.srcObject = localStream;
//             // Connect after making sure that local stream is availble
//             // socket.connect();
//             console.log('protocol', socket.protocol);
//         })
//         .catch(error => {
//             console.error('Stream not found: ', error);
//         });
// }

// let createPeerConnection = () => {
//     try {
//         pc = new RTCPeerConnection(PC_CONFIG);
//         pc.onicecandidate = onIceCandidate;
//         pc.ontrack = onTrack;
//         pc.addStream(localStream);
//         console.log('PeerConnection created');
//     } catch (error) {
//         console.error('PeerConnection failed: ', error);
//     }
// };

// let sendOffer = () => {
//     console.log('Send offer');
//     pc.createOffer().then(
//         setAndSendLocalDescription,
//         (error) => { console.error('Send offer failed: ', error); }
//     );
// };

// let sendAnswer = () => {
//     console.log('Send answer');
//     pc.createAnswer().then(
//         setAndSendLocalDescription,
//         (error) => { console.error('Send answer failed: ', error); }
//     );
// };

// let setAndSendLocalDescription = (sessionDescription) => {
//     pc.setLocalDescription(sessionDescription);
//     console.log('Local description set');
//     sendData(sessionDescription);
// };

// let onIceCandidate = (event) => {
//     if (event.candidate) {
//         console.log('ICE candidate');
//         sendData({
//         type: 'candidate',
//         candidate: event.candidate
//         });
//     }
// };

// let onTrack = (event) => {
//     console.log('Add track');
//     remoteStreamElement.srcObject = event.streams[0];
// };

// let handleSignalingData = (data) => {
//     console.log('Data received: ', data);
//     switch (data.type) {
//         case 'offer':
//             createPeerConnection();
//             pc.setRemoteDescription(new RTCSessionDescription(data));
//             sendAnswer();
//             break;
//         case 'answer':
//             pc.setRemoteDescription(new RTCSessionDescription(data));
//             break;
//         case 'candidate':
//             pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//             break;
//     }
// };

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