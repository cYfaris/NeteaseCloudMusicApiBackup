export default async function handler(req, res) {
  const { type, id } = req.query;
  const COOKIE = `MUSIC_U=${process.env.MUSIC_U};`; // 在 Vercel 项目的环境变量里配置 MUSIC_U

  const base = `https://${req.headers.host}`; // 同一个部署下，直接用自己的域名调自己的接口

  let trackIds = [];
  if (type === "playlist") {
    const r = await fetch(`${base}/playlist/track/all?id=${id}&cookie=${encodeURIComponent(COOKIE)}`);
    const d = await r.json();
    trackIds = (d.songs || []).map((s) => s.id);
  } else {
    trackIds = [id];
  }

  const result = await Promise.all(
    trackIds.map(async (tid) => {
      const [urlRes, detailRes, lrcRes] = await Promise.all([
        fetch(`${base}/song/url/v1?id=${tid}&level=exhigh&cookie=${encodeURIComponent(COOKIE)}`),
        fetch(`${base}/song/detail?ids=${tid}`),
        fetch(`${base}/lyric?id=${tid}`),
      ]);
      const urlData = await urlRes.json();
      const detailData = await detailRes.json();
      const lrcData = await lrcRes.json();
      const song = detailData.songs?.[0] || {};

      return {
        name: song.name || "未知歌曲",
        artist: (song.ar || []).map((a) => a.name).join("/") || "未知歌手",
        url: urlData.data?.[0]?.url || "",
        cover: song.al?.picUrl || "",
        lrc: lrcData.lrc?.lyric || "",
      };
    })
  );

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(result);
}
