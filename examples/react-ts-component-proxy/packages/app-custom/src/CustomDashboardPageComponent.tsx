import {PageComponentProps} from "@example/app-platform-api";

export function CustomDashboardPageComponent({ label, children }: PageComponentProps) {
    return (
        <div className="page">
            <h3>{label}</h3>
            {children}
            <p>OVERRIDE!</p>
        </div>
    );
}
