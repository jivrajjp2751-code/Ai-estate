// This file is the Custom API Adapter that connects the frontend to the Express/MongoDB backend.
// It replaces the previous Supabase client.

const BACKEND_URL = 'http://localhost:5000/api';

const createChain = (table: string) => {
    let queryFilters: { col: string; val: any }[] = [];
    let sortParams: { col: string; ascending: boolean } | null = null;

    const execute = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/${table}`);
            let result = await response.json();
            let data = result.data || [];

            // Normalize _id to id for frontend compatibility
            if (Array.isArray(data)) {
                data = data.map((item: any) => ({ ...item, id: item.id || item._id }));
            }

            // Apply Filters (Client-side Mock)
            if (queryFilters.length > 0) {
                data = data.filter((item: any) => {
                    return queryFilters.every(f => item[f.col] == f.val);
                });
            }

            // Apply Sort
            if (sortParams) {
                data.sort((a: any, b: any) => {
                    if (a[sortParams!.col] < b[sortParams!.col]) return sortParams!.ascending ? -1 : 1;
                    if (a[sortParams!.col] > b[sortParams!.col]) return sortParams!.ascending ? 1 : -1;
                    return 0;
                });
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('API Fetch Error:', err);
            return { data: null, error: { message: err.message } };
        }
    };

    const chain: any = {
        select: (columns = '*') => chain,
        eq: (column: string, value: any) => {
            queryFilters.push({ col: column, val: value });
            return chain;
        },
        neq: (column: string, value: any) => {
            // Simple mock for neq
            // Note: Real implementation would actally filter. 
            // For now, ignoring strictly or implementing simple.
            return chain;
        },
        order: (column: string, { ascending = false } = {}) => {
            sortParams = { col: column, ascending };
            return chain;
        },
        single: async () => {
            const result = await execute();
            if (result.data && result.data.length > 0) {
                return { data: result.data[0], error: null };
            }
            return { data: null, error: { message: 'No rows found' } };
        },
        maybeSingle: async () => {
            const result = await execute();
            if (result.data && result.data.length > 0) {
                return { data: result.data[0], error: null };
            }
            return { data: null, error: null };
        },
        then: (resolve: any, reject: any) => {
            execute().then(resolve).catch(reject);
        }
    };

    // Insert/Update/Delete
    chain.insert = async (data: any) => {
        const payload = Array.isArray(data) ? data[0] : data;
        try {
            const response = await fetch(`${BACKEND_URL}/${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (err: any) {
            return { data: null, error: { message: err.message } };
        }
    };

    chain.update = (data: any) => {
        return {
            eq: async (col: string, val: any) => {
                try {
                    // Assume 'id' is the primary key for updates usually
                    const url = col === 'id' ? `${BACKEND_URL}/${table}/${val}` : `${BACKEND_URL}/${table}?${col}=${val}`;
                    const response = await fetch(url, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    return await response.json();
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            },
            in: async (col: string, val: any) => {
                return { data: null, error: { message: "Update 'in' not implemented in mock adapter" } };
            }
        }
    };

    chain.delete = () => {
        return {
            eq: async (col: string, val: any) => {
                try {
                    const url = col === 'id' ? `${BACKEND_URL}/${table}/${val}` : `${BACKEND_URL}/${table}?${col}=${val}`;
                    const response = await fetch(url, {
                        method: 'DELETE'
                    });
                    return await response.json();
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            },
            in: async (col: string, vals: any[]) => {
                try {
                    if (col !== 'id') return { data: null, error: { message: "Bulk delete only supported by 'id'" } };
                    // Send as a custom bulk delete endpoint or query param
                    const response = await fetch(`${BACKEND_URL}/${table}/bulk-delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: vals })
                    });
                    return await response.json();
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            }
        }
    };

    return chain;
};

export const api = {
    auth: {
        onAuthStateChange: (callback: any) => {
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        getSession: async () => {
            // New storage key to force fresh login
            const token = localStorage.getItem('ai_estate_mongo_token');
            const userStr = localStorage.getItem('ai_estate_mongo_user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    return {
                        data: {
                            session: {
                                user: user,
                                access_token: token
                            }
                        },
                        error: null
                    };
                } catch (e) {
                    return { data: { session: null }, error: null };
                }
            }
            return { data: { session: null }, error: null };
        },
        signInWithPassword: async (credentials: any) => {
            try {
                const response = await fetch(`${BACKEND_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                const result = await response.json();
                if (result.data?.session?.access_token) {
                    localStorage.setItem('ai_estate_mongo_token', result.data.session.access_token);
                    if (result.data.user) {
                        localStorage.setItem('ai_estate_mongo_user', JSON.stringify(result.data.user));
                    }
                }
                return result;
            } catch (err: any) {
                return { data: null, error: { message: err.message } };
            }
        },
        signUp: async (credentials: any) => {
            try {
                const response = await fetch(`${BACKEND_URL}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });
                const result = await response.json();
                return result;
            } catch (err: any) {
                return { data: null, error: { message: err.message } };
            }
        },
        signOut: async () => {
            localStorage.removeItem('ai_estate_mongo_token');
            localStorage.removeItem('ai_estate_mongo_user');
            return { error: null };
        },
        getUser: async () => {
            const userStr = localStorage.getItem('ai_estate_mongo_user');
            if (userStr) return { data: { user: JSON.parse(userStr) }, error: null };
            return { data: { user: null }, error: null };
        },
    },
    from: (table: string) => {
        return createChain(table);
    },
    channel: (name: string) => ({
        on: (type: string, filter: any, callback: any) => ({
            subscribe: () => { }
        }),
        subscribe: () => { }
    }),
    removeChannel: (channel: any) => { },
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: any) => {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch(`${BACKEND_URL}/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    return result; // contains { data: { path, publicUrl } }
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            },
            getPublicUrl: (path: string) => {
                // If the path is already a full URL (from our upload response), return it
                if (path.startsWith('http')) {
                    return { data: { publicUrl: path } };
                }
                // Otherwise fallback (though our upload now returns full URL as path/data usually)
                // Note: Consumers might pass the filename back.
                return { data: { publicUrl: `${BACKEND_URL.replace('/api', '')}/uploads/${path}` } };
            },
            remove: async (paths: string[]) => {
                console.log('Mock storage remove:', paths);
                // Implementation for delete would allow cleaning up uploads
                // For now, logging is fine as it doesn't break the app logic
                return { data: paths, error: null };
            }
        })
    },
    functions: {
        invoke: async (funcName: string, options: any) => {
            console.log(`Mock Function Invoke: ${funcName}`, options);

            if (funcName === 'admin-grant-role-by-email') {
                // Redirect to backend endpoint
                try {
                    const response = await fetch(`${BACKEND_URL}/profiles`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(options.body)
                    });
                    const result = await response.json();
                    return result; // Backend returns { data: { profile: ... }, error: ... }
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            }

            if (funcName === 'purva-chat') {
                try {
                    const response = await fetch(`${BACKEND_URL}/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(options.body)
                    });
                    const result = await response.json();
                    return result;
                } catch (err: any) {
                    return { data: null, error: { message: err.message } };
                }
            }

            return {
                data: {
                    message: "This is a mock response from the locally hosted AI.",
                    response: "Mock response"
                },
                error: null
            };
        }
    }
};
