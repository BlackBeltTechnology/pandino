import {useState} from "react";

export function RemoteComponent() {
    const [state, setState] = useState({
        name: 'Remote',
    });

    return (
        <>
            <h3>Hello</h3>
            <p>From {state.name}!</p>
        </>
    );
}
