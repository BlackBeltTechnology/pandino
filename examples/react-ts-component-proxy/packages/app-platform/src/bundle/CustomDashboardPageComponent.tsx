import {PageComponentProps} from "app-platform-api";

export function CustomDashboardPageComponent({page}: PageComponentProps) {
    return (
        <div className="page">
            <h3>{page.name}</h3>
            <p>OVERRIDE!</p>
        </div>
    );
}
