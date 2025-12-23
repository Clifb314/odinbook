import React from "react";

export default function MsgBox({type, message, close}) {


  return (
    <div className={`slideIn ${type}`}>
      <button type="button" className="close" onClick={close}>
        X
      </button>
      <p>{message}</p>
    </div>
  );
}
