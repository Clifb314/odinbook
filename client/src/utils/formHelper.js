import React from "react";


export default function FormHelper({field, label, data, auto, change}) {


    let type
    if (field === 'birthdate') type = 'date'
    else if (field === 'password' || field === 'checkPW' || field === 'oldPW') type = 'password'
    else type = 'text'




    return (
        <label htmlFor={field}>{label}{' : '}
            <input
              type={type}
              id={field}
              name={field}
              value={data}
              onChange={change}
              autoComplete={auto}
              />
        </label>
    )
}