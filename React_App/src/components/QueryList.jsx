import React, { useEffect, useState } from 'react';
import './QueryList.css';
import { getAllQueries } from '../services/api';

const QueryList = ({ onSelectQuery, selectedQuery }) => {
    const [queries, setQueries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllQueries();
    }, []);

    const fetchAllQueries = async () => {
        setIsLoading(true);
        try {
            const queries = await getAllQueries();
            if (queries.success) {
                setQueries(queries.data.queries || []);
            } else {
                setError('Failed to fetch queries');
            }
        } catch (err) {
            setError('Failed to fetch queries');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="query-list-container">
            {isLoading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}
            {!isLoading && !error && (
                <ul className="query-list">
                    {queries.length === 0 ? (
                        <li className="empty">No queries found.</li>
                    ) : (
                        queries.map(query => (
                            <li
                                key={query.queryId}
                                className={`query-item${selectedQuery && selectedQuery.queryId === query.queryId ? ' selected' : ''}`}
                                onClick={() => onSelectQuery(query)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="query-prompt">{query.prompt}</div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

export default QueryList;
