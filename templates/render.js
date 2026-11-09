// usage: node render.js <weekdir> <outdir>
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [dir, out] = process.argv.slice(2).map(p => path.resolve(p));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + dir + '/carousel.html'); await p.evaluate(() => document.fonts.ready);
  const ids = await p.$$eval('section', s => s.map(x => x.id));
  for (let i = 0; i < ids.length; i++) await p.locator('#' + ids[i]).screenshot({ path: `${out}/1-monday-carousel-${i + 1}.png` });
  await p.goto('file://' + dir + '/poll.html'); await p.evaluate(() => document.fonts.ready);
  await p.locator('section').first().screenshot({ path: `${out}/3-friday-post.png` });
  const r = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await r.goto('file://' + dir + '/reel.html'); await r.evaluate(() => document.fonts.ready);
  const fdir = path.join(dir, 'frames'); fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
  const fps = 30, dur = 15;
  for (let f = 0; f < fps * dur; f++) {
    await r.evaluate(t => window.render(t), f / fps);
    await r.screenshot({ path: `${fdir}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${fdir}/%04d.jpg`,
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '20', '-c:a', 'aac', '-movflags', '+faststart',
    `${out}/2-wednesday-reel.mp4`]);
  console.log('done');
})();
