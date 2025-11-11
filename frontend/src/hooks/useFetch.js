import { useCallback, useRef, useState } from "react";

/**
 *
 * @param {RequestInfo} input - The fetch request info: a URL string or a Request object.
 * @param {RequestInit} [init] - Optional fetch init configuration.
 * @returns
 */
export function useFetch({ input, init }, { onError } = {}) {
	const [data, setData] = useState(undefined);
	const ac = useRef(null);

	const cancel = useCallback((reason = "aborted") => {
		if (ac.current) ac.current.abort(reason);
		ac.current = null;
	}, []);

	const fetchData = useCallback(
		async ({ query } = {}) => {
			cancel();

			const controller = new AbortController();
			ac.current = controller;
			try {
				setData(null);
				const res = await fetch(input + (query ? `?${query}` : ""), {
					...(init || {}),
					signal: controller.signal,
				});
				const json = await res.json();
				if (res.ok) setData(json);
				else {
					setData(undefined);
					onError?.(res);
				}
			} catch (err) {
				console.log(err);
				setData(undefined);
				return;
			}
		},
		[cancel, onError],
	);

	return {
		data: data ?? undefined,
		loading: data === null,
		cancel,
		fetch: fetchData,
	};
}
