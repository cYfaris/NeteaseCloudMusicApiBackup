export default async function handler(req, res) {
  const { type, id } = req.query;
  const COOKIE = `MUSIC_U=${process.env.MUSIC_U};`;
  const base = `https://${req.headers.host}`;

  let trackIds = [];
  if (type === "playlist") {
    const r = await fetch(`${base}/playlist/track/all?id=${id}&cookie=${encodeURIComponent(COOKIE)}`);
    const d = await r.json();
    trackIds = (d.songs || []).map((s) => s.id);
  } else {
    trackIds = [id];
  }

  const idsParam = trackIds.join(",");

  // 关键改动：批量请求，而不是逐首请求
  const [urlRes, detailRes] = await Promise.all([
    fetch(`${base}/song/url/v1?id=${idsParam}&level=exhigh&cookie=${encodeURIComponent(COOKIE)}`),
    fetch(`${base}/song/detail?ids=${idsParam}`),
  ]);
  const urlData = await urlRes.json();
  const detailData = await detailRes.json();

  const urlMap = Object.fromEntries((urlData.data || []).map((u) => [u.id, u.url]));
  const detailMap = Object.fromEntries((detailData.songs || []).map((s) => [s.id, s]));

  const result = trackIds.map((tid) => {
    const song = detailMap[tid] || {};
    return {
      name: song.name || "未知歌曲",
      artist: (song.ar || []).map((a) => a.name).join("/") || "未知歌手",
      url: urlMap[tid] || "",
      cover: song.al?.picUrl || "",
      lrc: `${base}/api/lyric?id=${tid}`, // 改成指向新接口的链接，不再塞原文
    };
  });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(result);
}
