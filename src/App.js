import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Peer from "simple-peer";
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Grid, Switch, Button, TextField, Paper } from "@material-ui/core";

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
    <form noValidate autoComplete="off">
    <Paper>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <div className="video-container">
            <div id="CallerVideo" className="video">
              {stream && (
                <video
                  playsInline
                  muted
                  ref={myVideo}
                  autoPlay
                  style={{ width: "300px" }}
                />
              )}
            </div>
            <div id="RecieverVideo" className="video">
              {callAccepted && !callEnded ? (
                <video
                  playsInline
                  ref={userVideo}
                  autoPlay
                  style={{ width: "300px" }}
                />
              ) : null}
            </div>
          </div>
          <div className="myId">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Switch
                  checked={turnCamera}
                  onChange={(e) => checkTurnCamera(e)}
                  name="checkedB"
                  color="primary"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="txtName"
                  label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  disabled
                  id="filled-disabled"
                  label="Your ID"
                  value={me}
                />
                <CopyToClipboard text={me}>
                  <Button variant="contained">Copy ID</Button>
                </CopyToClipboard>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="txtCallTo"
                  label="Call to ID"
                  value={idToCall}
                  onChange={(e) => setIdToCall(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <div className="call-button">
                  {callAccepted && !callEnded ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={leaveCall}
                    >
                      End Call
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => callUser(idToCall)}
                      color="primary"
                    >
                      Call
                    </Button>
                  )}
                </div>
              </Grid>
            </Grid>
          </div>
          <div className="calling">
            {receivingCall && !callAccepted ? (
              <div className="caller">
                <h1>{name} is Calling...</h1>
                <Button
                  variant="contained"
                  onClick={answerCall}
                  color="primary"
                >
                  Answer
                </Button>
              </div>
            ) : null}
          </div>
        </Grid>
      </Grid>
    </Paper>
    </form>
  );
}

export default App;
