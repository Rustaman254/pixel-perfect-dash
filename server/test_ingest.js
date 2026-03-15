const testIngest = async () => {
    const payload = {
        session: {
            sessionId: 'test-session-' + Date.now(),
            projectId: 3,
            browser: 'Test',
            os: 'Test',
            device: 'Desktop'
        },
        events: [
            { type: 'test', data: JSON.stringify({ message: 'Hello World' }), timestamp: new Date().toISOString(), url: 'http://test.com', path: '/' }
        ]
    };

    try {
        const response = await fetch('http://localhost:3001/api/insights/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
};

testIngest();
