import "./styles.css";
import { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState();
  const [query, setQuery] = useState();
  const [response, setResponse] = useState();

  const askLLM = async () => {
    const req = { file, query };
    console.log(req);
    const response = await axios.post(
      "https://slowhc.buildship.run/query",
      req,
    );

    setResponse(response.data);
  };

  async function fileToGenerativePart(file) {
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
    console.log(data);
  }

  return (
    <div className="App">
      <input type="file" onChange={(e) => updateFile(e.target.files)} />
      {response}
      <textarea onChange={(e) => setQuery(e.target.value)} />
      <button onClick={() => askLLM()}>Testing</button>
      {file && (
        <p>
          <img
            src={`data:${file.inlineData.mimeType};base64,${file.inlineData.data}`}
          />{" "}
        </p>
      )}
    </div>
  );
}
