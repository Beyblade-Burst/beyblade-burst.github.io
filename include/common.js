Promise.all([
    new Promise(res => indexedDB.deleteDatabase('V6').onsuccess = res),
    caches.delete('V6'), caches.delete('parts'),
    navigator.serviceWorker.getRegistrations().then(([worker]) => worker?.unregister())
])
.then(() => location.href = `https://go-shoot.github.io/burst/`).catch(er => {
    console.error(er);
    setTimeout(() => location.href = `https://go-shoot.github.io/burst/`, 1000)
});
