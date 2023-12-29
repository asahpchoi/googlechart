import "./styles.css";
import { useState } from "react";

export default function App() {
  const [file, setFile] = useState();
  const [query, setQuery] = useState();

  const getBase64 = (file) =>
    new Promise(function (resolve, reject) {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject("Error: ", error);
    });

  return (
    <div className="App">
      <input
        type="file"
        onChange={async (e) => {
          const file = e.target.files[0];
          const data = {
            inlineData: { data: await getBase64(file), mimeType: file.type },
          };
          setFile(data);
        }}
      />
      <textarea onChange={(e) => setQuery(e.target.value)} />
      <button>Testing</button>
      {file && <div>file</div>}
      {query && <div>query</div>}
    </div>
  );
}
