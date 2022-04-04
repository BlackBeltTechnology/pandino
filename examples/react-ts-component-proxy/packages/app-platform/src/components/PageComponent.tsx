import {PageComponentProps} from "@example/app-platform-api";

export function PageComponent({ label, children }: PageComponentProps) {
    return (
        <div className="page">
            <h3>{label}</h3>
            <p>This is the default <code>PageComponent</code> implementation</p>
            <hr />
            {children}
        </div>
    );
}