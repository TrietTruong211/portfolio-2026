const TIMEOUT_MS = 10_000;
export async function proxyToAws(url, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); }, TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'x-api-key': process.env['AWS_API_KEY']!,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        if (!res.ok) {
            throw new Error(`AWS responded ${res.status}`);
        }
        return res.json();
    }
    catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('AWS request timed out');
        }
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=aws.js.map