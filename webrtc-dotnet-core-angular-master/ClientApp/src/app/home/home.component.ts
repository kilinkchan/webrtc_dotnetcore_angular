import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';

declare var Peer: any;
declare var MediaRecorder: any;
let localVideo;
let localStream;
let pc1;
let pc2;
let startTime;
let yourConn;
let connectionState;
let recordedBlobs;
let mediaRecorder;
let dataChannel;
const configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };
  var peerConnectionConfig = {
    iceServers: [
        { urls: 'stun:168.254.0.104:3478' }
    ]
  };
  
let peerConn;
let remoteVideo;
const server = 'ws://192.168.98.182:5000'; //https wss://168.254.0.104:5001
const WEB_SOCKET = new WebSocket(server + '/ws');
const constraints = {
    video: true,
    audio: true
};

let sendChannel;
let recvChannel;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
    name;
    room;
    ngOnInit() {
        // this.playBtn();
        WEB_SOCKET.onopen = function (evt) {
            console.log('Connection open ...');
            $('#msgList').val('websocket connection opened .');
        };
        var getUserMediaSuccess = this.getUserMediaSuccess;
        var errorHandler = this.errorHandler;
        var handleOffer = this.handleOffer;
        var handleAnswer = this.handleAnswer;
        var handleCandidate = this.handleCandidate;
        var onSendChannelStateChange = this.onSendChannelStateChange;
        var receiveChannelCallback = this.receiveChannelCallback;
        var record = this.record;
        WEB_SOCKET.onmessage = function (evt) {
            console.log('Received Message: ' + evt.data);
            /*if (evt.data) {
                var content = $('#msgList').val();
                content = content + '\r\n' + evt.data;
                $('#msgList').val(content);
            }*/

            var getServerdata = JSON.parse(evt.data);
            console.log(getServerdata)


            if (getServerdata.type === 'login') {
                console.log(222222222)
                localVideo = document.getElementById('localVideo');
                remoteVideo = document.getElementById('remoteVideo');

                var constraints = {
                    video: true,
                    audio: true
                };

                yourConn = new RTCPeerConnection({
                    iceServers: [
                        //{'urls': 'stun:52.250.18.40:3478'}
                        {
                            'urls': 'stun:stun.l.google.com:19302'
                        }
                    ]
                  });

                yourConn.ondatachannel = receiveChannelCallback;
                sendChannel = yourConn.createDataChannel('sendDataChannel');
                
                sendChannel.onopen = onSendChannelStateChange;
                sendChannel.onclose = onSendChannelStateChange;

                
                  
                /* START:The camera stream acquisition */
                if (navigator.mediaDevices.getUserMedia) {
                    console.log("fefefefefdsdsadcwgrrw")
                    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
                    yourConn.ontrack = function (event) {
                        //alert('new stream added! ' + event.streams[0]);
                        remoteVideo.srcObject =  event.streams[0];
                        record(event.streams[0]);
                    };
                } else {
                    alert('Your browser does not support getUserMedia API');
                }
            } else if (getServerdata.type === 'offer') {
                console.log("offer!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                handleOffer(getServerdata.offer, getServerdata.id);
                console.log("22222222")
            } else if (getServerdata.type === 'answer') {
                console.log("answer!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                handleAnswer(getServerdata.answer);
                console.log("22222222")
            } else if (getServerdata.type === 'candidate') {
                console.log("[getServerdata.candidate]: " + JSON.stringify(getServerdata.candidate));
                handleCandidate(getServerdata.candidate);
                console.log("22222222")
            }
        };

        $('#btnJoin').on('click', function () {
            var roomNo = $('#txtRoomNo').val();
            var nick = $('#txtNickName').val();
            if (roomNo) {
                var msg = {
                    type: 'join',
                    msg: roomNo,
                    nick: nick
                };
                WEB_SOCKET.send(JSON.stringify(msg));
            }
        });

        $('#btnSend').on('click', function () {
            var message = $('#txtMsg').val();
            var nick = $('#txtNickName').val();
            if (message) {
                WEB_SOCKET.send(JSON.stringify({
                    type: 'send_to_room',
                    msg: message,
                    nick: nick
                }));
            }
        });

        $('#btnLeave').on('click', function () {
            var nick = $('#txtNickName').val();
            var msg = {
                type: 'leave',
                msg: '',
                nick: nick
            };
            WEB_SOCKET.send(JSON.stringify(msg));
        });

        /*console.log(111111111111111)
        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(this.getUserMediaSuccess).catch(this.errorHandler);
        } else {
            alert('Your browser does not support getUserMedia API');
        }
        */
        WEB_SOCKET.onclose = function (evt) {
            console.log('Connection closed.');
        };
    }

    onSendChannelStateChange() {
        const readyState = sendChannel.readyState;
        console.log('Send channel state is: ' + readyState);
        if (readyState === 'open') {
            console.log('Send channel state is: ' + 1);
        } else {
            console.log('Send channel state is: ' + 2);
        }
    }

    receiveChannelCallback(event) {
        console.log('Receive Channel Callback: ' + JSON.stringify(event.channel));
        recvChannel = event.channel;
        recvChannel.onmessage = function (event) {
            console.log('Received Message: ' + event.data);
        }
        recvChannel.onopen = function () {
            const readyState = recvChannel.readyState;
            console.log(`Receive channel state is: ${readyState}`);
        };
        recvChannel.onclose = function () {
            const readyState = recvChannel.readyState;
            console.log(`Receive channel state is: ${readyState}`);
        };
    }

    onReceiveChannelStateChange() {
        const readyState = recvChannel.readyState;
        console.log(`Receive channel state is: ${readyState}`);
    }

    onReceiveMessageCallback(event) {
        console.log('Received Message: ' + event.data);        
    }

    handleDataAvailable(event) {
        console.log('handleDataAvailable', event);
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    download() {
        const blob = new Blob(recordedBlobs, {type: 'video/webm'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    stopRecording() {
        console.log('stop button!!!!');
        mediaRecorder.stop();
    }

    record(stream) {
        console.log('record!!!!');
        recordedBlobs = [];
            let options = {mimeType: 'video/webm;codecs=vp9,opus'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not supported`);
                    options = {mimeType: 'video/webm;codecs=vp8,opus'};
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.error(`${options.mimeType} is not supported`);
                        options = {mimeType: 'video/webm'};
                        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                            console.error(`${options.mimeType} is not supported`);
                            options = {mimeType: ''};
                        }
                    }
                }
        try {
            console.log('MediaRecorder: ' + MediaRecorder);
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            console.log(`Exception while creating MediaRecorder: ${JSON.stringify(e)}`);
            return;
        }
        mediaRecorder.onstop = (event) => {
            console.log('Recorder stopped: ', event);
            console.log('Recorded Blobs: ', recordedBlobs);
          };
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedBlobs.push(event.data);
            }
        };
        mediaRecorder.start();
        /*$('#stop').on('click', function () {
            console.log('stopstopstopstopstopstopstopstopstopstopstopstopstopstopstopstop');
            mediaRecorder.stop();
        });*/
    }

    stop() {
        console.log('stopstopstopstopstopstopstopstopstopstopstopstopstopstopstopstop');
        mediaRecorder.stop();
    }

    isLogin(data) {
        console.log("aaaaaadata: " + data);
    }

    login() {
        //console.log(this.name);
        //if (this.name.length > 0) 
        {
            WEB_SOCKET.send(JSON.stringify({
                type: 'login', //name
                name: '' //user name
            }));
        }
    }

     async handleOffer(offer, name) {
        // connectedUser = name;
        console.log("handleOffer: " + 22222222);
        $('#anwser').on('click', async function () {
            console.log("32193821=38-21389-21893802138902183921")
            await yourConn.setRemoteDescription(new RTCSessionDescription(offer));
            yourConn.onicecandidate = function (event) {
                console.log('onicecandidate inside getusermedia success', JSON.stringify(event.candidate));
                if (event.candidate) {
                    let nick = $('#txtNickName').val();
                    let message = $('#txtMsg').val();
                    let msg = {
                        type: 'candidate',
                        candidate: event.candidate,
                    };
                    WEB_SOCKET.send(JSON.stringify(
                        msg));
    
              } else {
                  console.log('End of candidates.');
                  // Vanilla ICE
                  // sendMessage(peerConn.localDescription);
              }
            };
            console.log("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK")
            await yourConn.createAnswer(function (answer) {
                console.log("answer: " + JSON.stringify({
                    type: 'answer',
                    answer: answer
                }))
                yourConn.setLocalDescription(answer);
                WEB_SOCKET.send(JSON.stringify({
                    type: 'answer',
                    answer: JSON.stringify(answer)
                }));
            }, function (error) {
                alert('Error when creating an answer');
            });
        });
    }

    async handleAnswer(answer) {
        console.log('handleAnswer: ', answer);
        await yourConn.setRemoteDescription(new RTCSessionDescription(answer));
        
    }

    handleCandidate(candidate) {
        yourConn.addIceCandidate(new RTCIceCandidate(candidate));
    }

    answer() {

    }

    async call() {
        let message = $('#txtMsg').val();
        console.log("111111111111111111111"+message);
        console.log("this.room: "+ this.room);
        var room = this.room;
        let nick = $('#txtNickName').val();
        
        await yourConn.createOffer(function (offer) {
            console.log("offer: " + JSON. stringify(offer));
            WEB_SOCKET.send(JSON.stringify({
                type: 'offer',
                offer: offer
            }));

            yourConn.setLocalDescription(offer);
        }, function (error) {
            alert("Error when creating an offer: " + error);
            console.log("Error when creating an offer", error);
        });
        
    }

    errorHandler(error) {
        console.log("error!!!!!!!!!!!!!!!!!!!!!!!!");
      }

    gotRemoteStream(event) {
        console.log('got remote stream');
        remoteVideo.srcObject = event.streams[0];
    }

    public getUserMediaSuccess(stream) {
        localVideo = <HTMLVideoElement>document.getElementById('localVideo');
        remoteVideo = <HTMLVideoElement>document.getElementById('remoteVideo');
        localStream = stream;
        localVideo.srcObject = stream;

        /*localStream.getTracks().forEach(track => {
            yourConn.addTrack(track, localStream);
        })*/

        connectionState = yourConn.connectionState;
        console.log('connection state inside getusermedia: ' + connectionState);
        yourConn.addStream(localStream);
    }

    sendMsg() {
        console.log('sendMsg')
        sendChannel.send('test');
    }
}