import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

<style>
  {`
    div::-webkit-scrollbar {
      width: 6px;
    }
    div::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    div::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    div::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `}
</style>

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);