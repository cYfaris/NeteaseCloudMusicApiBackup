export default async function handler(req, res) {
  const { id, name, artist } = req.query; // 让 adapter 把歌名、歌手也传过来
  const base = `https://${req.headers.host}`;

  // 第一步：先按原来的方式，直接查这首歌自己的歌词
  let r = await fetch(`${base}/lyric?id=${id}`);
  let d = await r.json();
  let lrc = d.lrc?.lyric || "";

  // 第二步：如果没有歌词，且有歌名信息，尝试搜索匹配官方版本
  if (!lrc && name) {
    const keyword = artist ? `${name} ${artist}` : name;
    const searchRes = await fetch(`${base}/search?keywords=${encodeURIComponent(keyword)}&limit=1`);
    const searchData = await searchRes.json();
    const matchedId = searchData.result?.songs?.[0]?.id;

    if (matchedId) {
      const lrcRes = await fetch(`${base}/lyric?id=${matchedId}`);
      const lrcData = await lrcRes.json();
      lrc = lrcData.lrc?.lyric || "";
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(lrc);
}
