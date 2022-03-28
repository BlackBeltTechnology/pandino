import {PageComponentProps, useBundleContext} from "@example/app-platform-api";

export function CustomDashboardPageComponent({ label, children }: PageComponentProps) {
    const { bundleContext, meta, update } = useBundleContext();

    console.log(bundleContext);
    console.log(meta);

    return (
        <div className="page">
            <h3>{label}</h3>
            {children}
            <p>OVERRIDE!!!</p>
            <button onClick={update}>Update Meta</button>
        </div>
    );
}
