import React from "react";
import CommentCard from "./commentCard";


export default function PopupReply({hovering, reply}) {

    const display = hovering 
    ?   <CommentCard comment={reply} />
    :   null



    return (
        <div className="replyPreview">{display}</div>
    )


}