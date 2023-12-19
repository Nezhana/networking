// Config variables
const SIGNALING_SERVER_URL = 'http://192.168.1.109:8000';
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
// const PC_CONFIG = {};

let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on('data', (data) => {
  console.log('Data received: ',data);
  handleSignalingData(data);
});

socket.on('ready', () => {
  console.log('Ready');
  // Connection with signaling server is ready, and so is local stream
  createPeerConnection();
  sendOffer();
});

socket.on('connect', () => {
  console.log('connected', socket.connected);
  console.log(socket.id);
});

let sendData = (data) => {
  socket.emit('data', data);
};

// WebRTC methods
let pc;
let localStream;
let remoteStreamElement = document.querySelector('#remoteStream');
let localStreamElement = document.querySelector('#localStream');

let getLocalStream = () => {
  navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    .then((stream) => {
      console.log('Stream found');
      localStream = stream;
      // Disable the microphone and video by default
      stream.getAudioTracks()[0].enabled = false;
      stream.getVideoTracks()[0].enabled = false;
      localStreamElement.srcObject = localStream;
      // Connect after making sure that local stream is availble
      socket.connect();
    })
    .catch(error => {
      console.error('Stream not found: ', error);
    });
}

let createPeerConnection = () => {
  try {
    pc = new RTCPeerConnection(PC_CONFIG);
    pc.onicecandidate = onIceCandidate;
    pc.ontrack = onTrack;
    pc.addStream(localStream);
    console.log('PeerConnection created');
  } catch (error) {
    console.error('PeerConnection failed: ', error);
  }
};

let sendOffer = () => {
  console.log('Send offer');
  pc.createOffer().then(
    setAndSendLocalDescription,
    (error) => { console.error('Send offer failed: ', error); }
  );
};

let sendAnswer = () => {
  console.log('Send answer');
  pc.createAnswer().then(
    setAndSendLocalDescription,
    (error) => { console.error('Send answer failed: ', error); }
  );
};

let setAndSendLocalDescription = (sessionDescription) => {
  pc.setLocalDescription(sessionDescription);
  console.log('Local description set');
  sendData(sessionDescription);
};

let onIceCandidate = (event) => {
  if (event.candidate) {
    console.log('ICE candidate');
    sendData({
      type: 'candidate',
      candidate: event.candidate
    });
  }
};

let onTrack = (event) => {
  console.log('Add track');
  remoteStreamElement.srcObject = event.streams[0];
};

let handleSignalingData = (data) => {
  switch (data.type) {
    case 'offer':
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer();
      break;
    case 'answer':
      pc.setRemoteDescription(new RTCSessionDescription(data));
      break;
    case 'candidate':
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
};

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