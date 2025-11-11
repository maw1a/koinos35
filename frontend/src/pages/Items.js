import React, { useEffect, useState, useMemo, useRef } from "react";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";
import { List } from "react-window";

const PAGE_SIZE = 5;

function Items() {
	const [page, setPage] = useState(1);
	const [q, setQ] = useState("");
	const qRef = useRef();
	const { items, fetchItems, abort, total, loading } = useData();

	useEffect(() => {
		// Trigger load; use the provided fetch and ensure we cancel on unmount to avoid leaks
		fetchItems({
			query: `pg=${page}${q.trim().length > 0 ? `&q=${q}` : ""}`,
		}).catch(console.error);

		return () => {
			abort("unmount");
		};
	}, [abort, page, q]);

	const pageCount = Math.max(1, Math.ceil((total || 0) / PAGE_SIZE));

	// Ensure current page is valid if items change
	useEffect(() => {
		if (page > pageCount) setPage(pageCount);
	}, [pageCount, page]);

	const RowComponent = ({ index: rowIndex, style, items }) => {
		const item = items[rowIndex];
		if (!item) return null;
		return (
			<div
				style={{
					...style,
					display: "flex",
					alignItems: "center",
					paddingLeft: 8,
				}}
			>
				<Link to={"/items/" + item.id}>{item.name}</Link>
			</div>
		);
	};

	// If there are no items yet and total suggests there should be some, show loading
	if (loading) return <p>Loading...</p>;

	return (
		<div>
			<div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
				<input
					ref={qRef}
					type="search"
					defaultValue={q}
					placeholder="Search..."
				/>
				<button
					type="button"
					onClick={() => {
						if (qRef.current) {
							setQ(qRef.current.value);
						}
					}}
				>
					Find
				</button>
			</div>

			<div
				style={{
					marginBottom: 8,
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<button
					onClick={() => setPage((p) => Math.max(1, p - 1))}
					disabled={page === 1}
				>
					Prev
				</button>
				<span>
					Page {page} of {pageCount}
				</span>
				<button
					onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
					disabled={page === pageCount}
				>
					Next
				</button>
				<div style={{ marginLeft: "auto" }}>
					<span style={{ marginRight: 8 }}>{(items || []).length} items</span>
				</div>
			</div>

			<List
				rowComponent={RowComponent}
				rowCount={items.length}
				rowHeight={40}
				rowProps={{ items }}
				height={400}
				width="100%"
			/>
		</div>
	);
}

export default Items;
