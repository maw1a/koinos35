import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { BASE_API_URL } from "../utils/constants";

function ItemDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const request = useFetch(
		{ input: BASE_API_URL + "/api/items/" + id },
		{ onError: () => navigate("/") },
	);

	useEffect(() => {
		request.fetch();

		return () => {
			request.cancel("unmount");
		};
	}, []);

	if (!request.data) return <p>Loading...</p>;

	return (
		<div style={{ padding: 16 }}>
			<h2>{request.data.name}</h2>
			<p>
				<strong>Category:</strong> {request.data.category}
			</p>
			<p>
				<strong>Price:</strong> ${request.data.price}
			</p>
		</div>
	);
}

export default ItemDetail;
