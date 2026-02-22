import { useCallback, useEffect, useState } from "react";

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
    refetch: () => void;
}

/**
 * Simple hook to call an async service function and manage loading/error/data.
 *
 * Usage:
 *   const { data, loading, error } = useApi(() => getRecommended(lat, lng));
 */
export function useApi<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
): UseApiResult<T> {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    const execute = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const data = await fetcher();
            setState({ data, loading: false, error: null });
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setState({ data: null, loading: false, error: message });
        }
    }, deps);

    useEffect(() => {
        execute();
    }, [execute]);

    return { ...state, refetch: execute };
}
