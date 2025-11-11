import React, { createContext, useContext, useEffect, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { BASE_API_URL } from "../utils/constants";

const DataContext = createContext();

export function DataProvider({ children }) {
	const request = useFetch({ input: BASE_API_URL + `/api/items` });

	return (
		<DataContext.Provider
			value={{
				items: request.data?.items || [],
				total: request.data?.total ?? 10000,
				loading: request.loading,
				fetchItems: request.fetch,
				abort: request.cancel,
			}}
		>
			{children}
		</DataContext.Provider>
	);
}

export const useData = (pg) => {
	const value = useContext(DataContext);
	return value;
};
