import { FC, useEffect, useState } from "react";
import { ComponentProxyProps, useReactBundleContext } from "@pandino/pandino-react-dom-api";

interface Pokemon {
    id: number,
    name: string,
    image: string,
}

export function Pokemon() {
    const [list, setList] = useState<Array<Pokemon>>([]);
    const [visibleList, setVisibleList] = useState<Array<Pokemon>>([]);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [pages, setPages] = useState(1);
    const context = useReactBundleContext();
    const componentProxyRef = context.bundleContext.getServiceReference<FC<ComponentProxyProps>>('@pandino/pandino-react-dom/ComponentProxy');
    let ComponentProxy: FC<ComponentProxyProps> = context.bundleContext.getService(componentProxyRef);

    useEffect(() => {
        (async () => {
            const res = await fetch('https://raw.githubusercontent.com/jherr/pokemon/main/index.json');
            const json = await res.json();
            setList(json.slice(0, 99));
            setVisibleList(json.slice(0, limit - 1));
            setPages(10); // yes, static for now
        })();
    }, []);

    const loadPage = (pageNum: number): void => {
        const trimStart = pageNum * limit;
        setPage(pageNum);
        setVisibleList(list.splice(trimStart, limit - 1))
    };

    return (
        <>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Pokémon</h1>
            </div>
            <table className="table">
                <thead>
                <tr>
                    <th scope="col">Image</th>
                    <th scope="col">Name</th>
                </tr>
                </thead>
                <tbody>
                {visibleList.map((pokemon, idx) => (
                    <tr key={pokemon.name}>
                        <td>
                            <img
                                style={{
                                    maxHeight: 60,
                                }}
                                src={`https://raw.githubusercontent.com/jherr/pokemon/main/images/${pokemon.name.toLowerCase()}.jpg`}
                                alt={pokemon.name}
                            />
                        </td>
                        <td>{pokemon.name}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <nav aria-label="Page navigation example">
                <ul className="pagination">
                    <li className="page-item"><a className="page-link" href="#">Previous</a></li>
                    {[...Array(pages).keys()].map(p => (
                        <li key={p} className="page-item">
                            <a className="page-link" style={{ cursor: 'pointer' }} onClick={() => loadPage(p)}>{p + 1}</a>
                        </li>
                    ))}
                    <li className="page-item"><a className="page-link" href="#">Next</a></li>
                </ul>
            </nav>
        </>
    );
}
