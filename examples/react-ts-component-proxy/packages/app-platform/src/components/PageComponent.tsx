import {PageComponentProps} from "app-platform-api";

export default function PageComponent({ page }: PageComponentProps) {
    return (
        <div className="page">
            <h3>{page.name}</h3>
            <p>This is the default <code>PageComponent</code> implementation</p>
        </div>
    );
}
