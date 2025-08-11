function App() {
  const defaultChecks = [
    { id: 'cloudflare', name: 'Cloudflare (1.1.1.1)', url: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A' },
    { id: 'google', name: 'Google DNS', url: 'https://dns.google/resolve?name=example.com' },
    { id: 'quad9', name: 'Quad9 (9.9.9.9)', url: 'https://dns.quad9.net/dns-query?name=example.com&type=A' },
  ];

  const [endpoints, setEndpoints] = React.useState(defaultChecks);
  const [domain, setDomain] = React.useState('example.com');
  const [results, setResults] = React.useState({});
  const [running, setRunning] = React.useState(false);
  const [themeDark, setThemeDark] = React.useState(true);
  const [timeoutMs, setTimeoutMs] = React.useState(4000);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', themeDark);
  }, [themeDark]);

  const testOnce = async () => {
    if (running) {
      setRunning(false);
      return;
    }
    setResults({});
    setRunning(true);

    for (let ep of endpoints) {
      const url = ep.url.replace(/example\\.com/g, encodeURIComponent(domain));
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'accept': 'application/dns-json' },
          signal: controller.signal
        });
        clearTimeout(timeout);
        const latency = Math.round(performance.now() - start);
        if (res.ok) {
          setResults(prev => ({ ...prev, [ep.id]: { ok: true, latency } }));
        } else {
          setResults(prev => ({ ...prev, [ep.id]: { ok: false, error: `HTTP ${res.status}` } }));
        }
      } catch (err) {
        setResults(prev => ({ ...prev, [ep.id]: { ok: false, error: err.message } }));
      }
    }
    setRunning(false);
  };

  const pretty = (r) => {
    if (!r) return { label: 'منتظر...', cls: 'bg-gray-300 text-gray-800' };
    if (r.ok) return { label: `آنلاین · ${r.latency} ms`, cls: 'bg-emerald-500 text-white' };
    return { label: `آفلاین · ${r.error}`, cls: 'bg-rose-500 text-white' };
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">DNS Tester</h1>
          <button onClick={() => setThemeDark(d => !d)} className="px-3 py-2 bg-white/5 rounded">
            {themeDark ? 'تم روشن' : 'تم تاریک'}
          </button>
        </header>

        <div className="bg-white/5 p-4 rounded-xl">
          <label>دامنه: </label>
          <input value={domain} onChange={e => setDomain(e.target.value)} className="bg-white/5 px-3 py-2 rounded w-full mb-4" />
          <label>Timeout (ms): </label>
          <input type="number" value={timeoutMs} onChange={e => setTimeoutMs(Number(e.target.value))} className="bg-white/5 px-3 py-2 rounded w-full mb-4" />
          <button onClick={testOnce} className={`px-4 py-2 rounded ${running ? 'bg-rose-500' : 'bg-sky-500'}`}>
            {running ? 'توقف' : 'شروع تست'}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {endpoints.map(ep => {
            const r = results[ep.id];
            const p = pretty(r);
            return (
              <div key={ep.id} className="flex justify-between items-center bg-white/3 p-3 rounded-lg">
                <div>
                  <div className="font-bold">{ep.name}</div>
                  <div className="text-sm text-slate-300">{ep.url}</div>
                </div>
                <div className={`px-3 py-1 rounded-full ${p.cls}`}>{p.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
