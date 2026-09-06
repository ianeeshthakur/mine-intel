const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => {
    const topTargetsPanel = document.querySelector('.w-\\[380px\\]');
    return topTargetsPanel ? topTargetsPanel.innerText : 'Not found';
  });
  
  console.log("TOP TARGETS PANEL TEXT:");
  console.log(text);
  
  const mapClusters = await page.evaluate(() => {
    return document.querySelector('.leaflet-marker-pane').innerHTML;
  });
  console.log("MAP MARKERS HTML:");
  console.log(mapClusters.substring(0, 500) + '...');
  
  await browser.close();
})();
