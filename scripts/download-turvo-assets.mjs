import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const assets = [
  // Logos
  { url: 'https://turvo.com/wp-content/uploads/2022/09/Turvo-Logo-SVG.svg', dest: 'public/images/turvo-logo.svg' },
  { url: 'https://turvo.com/wp-content/uploads/2020/07/Turvo-logo_True-Black-Mark-300x300.png', dest: 'public/images/turvo-icon.png' },
  
  // Hero
  { url: 'https://turvo.com/wp-content/uploads/2023/06/Turvo-Screen-2-00_2023-1.gif', dest: 'public/images/hero/hero-screen.gif' },
  { url: 'https://turvo.com/wp-content/uploads/2022/04/No-gps.png', dest: 'public/images/hero/hero-fallback.png' },

  // Solutions
  { url: 'https://turvo.com/wp-content/uploads/2022/09/bg-shippers-1-1024x557.jpg', dest: 'public/images/solutions/bg-3pls.jpg' },
  { url: 'https://turvo.com/wp-content/uploads/2022/09/bg-brokers-1024x1024.jpg', dest: 'public/images/solutions/bg-brokers.jpg' },
  { url: 'https://turvo.com/wp-content/uploads/2022/09/bg-3pls-1-1024x700.jpg', dest: 'public/images/solutions/bg-shippers.jpg' },
  { url: 'https://turvo.com/wp-content/uploads/2022/09/bg-carriers-1-1024x682.jpg', dest: 'public/images/solutions/bg-carriers.jpg' },

  // Features (Collaboration Cloud)
  { url: 'https://turvo.com/wp-content/uploads/2022/09/Collaboration-cloud-Final-1024x740.png', dest: 'public/images/features/collaboration-cloud.png' },
  { url: 'https://turvo.com/wp-content/uploads/2022/09/Turvo-TMS-1024x740.png', dest: 'public/images/features/turvo-tms.png' },
  { url: 'https://turvo.com/wp-content/uploads/2022/09/Turvo-Grow-ROI-1024x740.png', dest: 'public/images/features/grow-roi.png' },

  // Marquee Partner Logos
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Lineage-3.png', dest: 'public/images/logos/lineage.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Ryder-1-1.png', dest: 'public/images/logos/ryder.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Zengestics.png', dest: 'public/images/logos/zengistics.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Cardinal-4.png', dest: 'public/images/logos/cardinal.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Portcity-.png', dest: 'public/images/logos/portcity.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Veritas-3.png', dest: 'public/images/logos/veritas.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/GW-4.png', dest: 'public/images/logos/gw.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/BB-3.png', dest: 'public/images/logos/bestbay.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/RPM-2.png', dest: 'public/images/logos/rpm.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/04/Transloop-3.png', dest: 'public/images/logos/transloop.png' },
  { url: 'https://turvo.com/wp-content/uploads/2025/03/PortX.png', dest: 'public/images/logos/portx.png' },

  // Customer video spotlight
  { url: 'https://turvo.com/wp-content/uploads/2022/09/thb-customer-story.jpg', dest: 'public/images/resources/portx-video-thumb.jpg' },

  // Blog / Resource Articles
  { url: 'https://turvo.com/wp-content/uploads/2026/08/Artboard-%E2%80%93-4-768x401.png', dest: 'public/images/resources/article-1.png' },
  { url: 'https://turvo.com/wp-content/uploads/2026/08/02-1-768x404.png', dest: 'public/images/resources/article-2.png' },
  { url: 'https://turvo.com/wp-content/uploads/2026/08/02-copy-768x380.jpg', dest: 'public/images/resources/article-3.jpg' },

  // Mega-menu featured items
  { url: 'https://turvo.com/wp-content/uploads/2020/06/turvoandryderrydershare-1024x512.jpg', dest: 'public/images/mega-menu/rydershare.jpg' },
  { url: 'https://turvo.com/wp-content/uploads/2026/02/AZL-768x401.jpg', dest: 'public/images/mega-menu/alpha-zero.jpg' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(dest);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(fullPath);
    const client = url.startsWith('https') ? https : http;

    const request = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(fullPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Starting download of ${assets.length} assets...`);
  for (const asset of assets) {
    try {
      await downloadFile(asset.url, asset.dest);
    } catch (err) {
      console.error(`Error downloading ${asset.url}:`, err.message);
    }
  }
  console.log('All downloads completed!');
}

run();
