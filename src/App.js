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
import Compressor from "compressorjs";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

export default function App() {
  const [file, setFile] = useState();
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();
  const [fileUrl, setFileUrl] = useState();
  const [isLoading, setIsLoading] = useState(false);

  // Create Supabase client
  const supabase = createClient(
    "https://kvsjbenmmfqnabxmiunh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c2piZW5tbWZxbmFieG1pdW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM5MjU4MjcsImV4cCI6MjAxOTUwMTgyN30.Gwzvs3yVxmaS_iVXVwhBPBo3fPWSFd5C1G4qaAFOoHA",
  );
  // Upload file using standard upload
  async function uploadFile(file) {
    new Compressor(file, {
      quality: 0.8, // 0.6 can also be used, but its not recommended to go below.
      success: (compressedResult) => {
        // compressedResult has the compressed file.
        // Use the compressed file to upload the images to your server.
        console.log({ file, compressedResult });
      },
    });

    const { data, error } = await supabase.storage
      .from("photos")
      .upload(file.name, file, { upsert: true });

    if (error) {
      // Handle error
      console.log(error);
    } else {
      // Handle success
      console.log(data);

      const pUrl = `https://kvsjbenmmfqnabxmiunh.supabase.co/storage/v1/object/public/${data.fullPath}`;

      setFileUrl(pUrl);
      console.log({ fileUrl, pUrl });
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
            label="Question"
            variant="outlined"
            onChange={(e) => setQuery(e.target.value)}
            multiline
            rows={4}
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
        </CardActions>
      </Card>
      <Box style={{ width: "90vw", overflow: "wrap", padding: "10px 5px" }}>
        {response && <div>{response}</div>}
      </Box>
      <Backdrop sx={{ color: "#fff", zIndex: 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}
