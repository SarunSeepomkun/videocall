import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Peer from "simple-peer";
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";

const socket = io.connect("https://ipeach-videocall.herokuapp.com/");
function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [turnCamera, setTurnCarema] = useState(true);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: turnCamera, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, [turnCamera]);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  const checkTurnCamera = (e) => {
    setTurnCarema(e.target.checked);
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div id="CallerVideo" className="video card m-1 p-1 col-md-5">
          {stream && (
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{ width: "100%", hieght: "100%" }}
            />
          )}
          <div className="myId">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="chkTurnCamera"
                checked={turnCamera}
                onChange={(e) => checkTurnCamera(e)}
              />
              <label className="form-check-label" htmlFor="lblTurnCamera">
                Turn On/Off Camera
              </label>
            </div>
            <label className="form-label" htmlFor="txtName">
              Your name
            </label>
            <input
              type="text"
              id="txtName"
              className="form-control form-control-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="form-label" htmlFor="txtName">
              Your ID
            </label>
            <div className="input-group">
              <input
                disabled
                className="form-control form-control-sm"
                type="text"
                value={me}
              />
              <CopyToClipboard text={me}>
                <button id="btnCopyID" className="btn btn-secondary btn-sm">
                  Copy ID
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        <div id="RecieverVideo" className="video card m-1 p-1 col-md-5">
          <div className="callTo">
            {receivingCall && !callAccepted ? (
              <div className="caller">
                <h3>{name} is Calling...</h3>
                <button
                  id="btnAnswer"
                  className="btn btn-success btn-sm"
                  onClick={answerCall}
                >
                  Answer
                </button>
              </div>
            ) : null}
          </div>
          {callAccepted && !callEnded ? (
            <video
              playsInline
              ref={userVideo}
              autoPlay
              style={{ width: "100%", hieght: "100%" }}
            />
          ) : null}

          <label className="form-label" htmlFor="txtCallTo">
            Call to ID
          </label>
          <div className="input-group">
            <input
              id="txtCallTo"
              className="form-control form-control-sm"
              type="text"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
            />
            {callAccepted && !callEnded ? (
              <button
                id="btnEndCall"
                className="btn btn-danger btn-sm"
                onClick={leaveCall}
              >
                End Call
              </button>
            ) : (
              <button
                id="btnCall"
                className="btn btn-primary btn-sm"
                onClick={() => callUser(idToCall)}
              >
                Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
