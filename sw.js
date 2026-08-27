// オフラインでも動くようにするための仕組み（サービスワーカー）。
// 電波があるときは常に最新のファイルを使い、電波がない場所でだけ、
// 前回保存した内容（キャッシュ）を使って表示します。
// メモのデータ自体はこのファイルとは別に、端末内(localStorage)に保存されます。
//
// ★更新のたびに、この CACHE_NAME の数字を1つ増やしてください。
//   （数字を変えないと、iPhone側が「更新なし」と判断し、新しい内容に切り替わらないことがあります）
const CACHE_NAME = 'ext-phone-memo-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ネットワーク優先：電波があれば必ず最新版を取りに行き、取れたらキャッシュも更新。
// 電波がない・取得に失敗したときだけ、保存済みの内容を表示します。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
