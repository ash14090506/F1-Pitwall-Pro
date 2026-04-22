import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

export const useFetch = (endpoint, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If dependencies array contains null/undefined, don't fetch
        if (dependencies.some(dep => !dep)) return;

        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE}${endpoint}`);
                if (isMounted) {
                    setData(res.data);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setError(err.response?.data?.detail || "Failed to fetch data.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, dependencies);

    return { data, loading, error };
};
