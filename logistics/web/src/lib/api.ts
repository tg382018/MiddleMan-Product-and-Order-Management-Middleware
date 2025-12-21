const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export async function apiGet(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return res.json();
}

export async function apiPost(path: string, body: any) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return res.json();
}
