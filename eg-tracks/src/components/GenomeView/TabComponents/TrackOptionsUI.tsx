import React, { useState, ChangeEvent } from "react";
import { HELP_LINKS } from "../../../models/util";
// import {Controlled as CodeMirror} from 'react-codemirror2';
// import 'codemirror/mode/javascript/javascript';
// import 'codemirror/lib/codemirror.css';
// import 'codemirror/theme/material.css';
import "./TrackOptionsUI.css";

interface TrackOptionsUIProps {
  onGetOptions: (value: string) => void;
}

const TrackOptionsUI: React.FC<TrackOptionsUIProps> = ({ onGetOptions }) => {
  const [value, setValue] = useState<string>("");

  // const handleChange = (editor, data, value) => {
  //   setValue(value);
  //   onGetOptions(value);
  // };

  const handleChangeSimple = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onGetOptions(newValue);
  };

  const fillExample = () => {
    const exampleValue = '{"height": 100, "color": "red"}';
    setValue(exampleValue);
    onGetOptions(exampleValue);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <label>(Optional) Configure track options below in JSON format:</label>
      <span>
        <button
          type="button"
          className="btn btn-link btn-sm"
          onClick={fillExample}
        >
          Example
        </button>
      </span>
      <span style={{ marginLeft: "5px", fontStyle: "italic" }}>
        <a
          href={HELP_LINKS.trackOptions}
          target="_blank"
          rel="noopener noreferrer"
        >
          available properties for tracks
        </a>
      </span>
      {/* <CodeMirror 
        value={value}
        options={{
          theme: "default",
          height: "auto",
          viewportMargin: Infinity,
          mode: {
            name: "javascript",
            json: true,
            statementIndent: 4,
          },
          lineNumbers: true,
          lineWrapping: true,
          indentWithTabs: false,
          tabSize: 4,
        }}
        onBeforeChange={handleChange}
        // onChange={handleChange}
      /> */}

      <textarea
        className="w-100 p-3"
        value={value}
        onChange={handleChangeSimple}
        rows={2}
      />
    </div>
  );
};

export default TrackOptionsUI;
