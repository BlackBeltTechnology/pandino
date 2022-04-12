import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Settings() {
    const navigate = useNavigate();

    // useEffect(() => {
    //     return () => {
    //         navigate('/');
    //     }
    // }, []);

    return (
        <>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Settings</h1>
            </div>
            <p>Hello!</p>
        </>
    );
}
