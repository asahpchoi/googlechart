import "./styles.css";
import { useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import { createClient } from "@supabase/supabase-js";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { AudioRecorder, useAudioRecorder } from "react-audio-voice-recorder";
//import Replicate from "replicate";
const supabaseUrl = "https://lvpqqxkyijqwrbudgjiu.supabase.co";

export default function App() {
  const [file, setFile] = useState();
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();
  const [fileUrl, setFileUrl] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState();
  const recorderControls = useAudioRecorder();

  // Create Supabase client
  const supabase = createClient(
    supabaseUrl,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cHFxeGt5aWpxd3JidWRnaml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2ODI5OTIsImV4cCI6MjAyMjI1ODk5Mn0.vg8z-tZxFnIlzY3-kGHoHYeb-OWNagvcbCxjxc_Qh6g",
  );
  // Upload file using standard upload
  async function uploadFile(file) {
    const { data, error } = await supabase.storage
      .from("audiofiles")
      .upload(file.name, file, { upsert: true });

    if (error) {
      // Handle error
      console.log(error);
    } else {
      // Handle success
      console.log(data);

      const pUrl = `${supabaseUrl}/storage/v1/object/public/${data.fullPath}`;

      setFileUrl(pUrl);
      return pUrl;
    }
  }
  const askLLM = async () => {
    const req = { file, query };
    console.log(req);
    setIsLoading(true);
    const response = await axios.post(
      "https://slowhc.buildship.run/query",
      req,
    );
    setIsLoading(false);

    setResponse(response.data);
  };
  async function fileToGenerativePart(file) {
    uploadFile(file);

    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });

    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }
  async function updateFile(files) {
    const file = files[0];
    const data = await fileToGenerativePart(file);

    setFile(data);
  }

  async function askReplicate(audio) {
    console.log({ audio });
    const response = await axios.get(
      `https://299hv3-3000.csb.app/v2t?audio=${audio}`,
    );
    console.log({ response });
    return response;
  }

  const addAudioElement = async (blob) => {
    console.log({ blob });
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
    const file = new File([blob], "audio.mp3");
    const pUrl = await uploadFile(file);

    const response = await askReplicate(pUrl);
    setTranscript(response.data.transcription);
    setQuery(response.data.transcription);
    askLLM();
    return response;
    //console.log({ pUrl });
  };

  return (
    <div>
      <Card>
        <CardContent className="App">
          <input
            accept="image/*,capture=camera"
            capture="”camera"
            type="file"
            onChange={(e) => updateFile(e.target.files)}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            component="label"
            onClick={() => document.querySelector("input").click()}
          >
            Take Photo
          </Button>

          {file && (
            <p>
              <img
                style={{ maxWidth: "90vw", maxHeight: "20vh" }}
                src={fileUrl}
              />{" "}
            </p>
          )}

          <TextField
            id="query"
            variant="outlined"
            onChange={(e) => setQuery(e.target.value)}
            multiline
            rows={4}
            value={query}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  onClick={() => {
                    document.getElementById("query").value = "";
                    setQuery("");
                  }}
                >
                  x
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
        <CardActions>
          <Button fullWidth onClick={() => askLLM()}>
            Ask Question
          </Button>
          <AudioRecorder
            onRecordingComplete={addAudioElement}
            audioTrackConstraints={{
              noiseSuppression: true,
              echoCancellation: true,
            }}
            recorderControls={recorderControls}
          />
          {recorderControls.isRecording && (
            <button onClick={recorderControls.stopRecording}>
              Stop recording
            </button>
          )}
        </CardActions>
      </Card>
      <Box style={{ width: "90vw", overflow: "wrap", padding: "10px 5px" }}>
        {response && <div>{response}</div>}
      </Box>
      <p>{transcript}</p>
      <Backdrop sx={{ color: "#fff", zIndex: 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}
