export default async function handler(req, res) {
  const { id } = req.query;
  const r = await fetch(`https://${req.headers.host}/lyric?id=${id}`);
  const d = await r.json();

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(d.lrc?.lyric || "");
}
