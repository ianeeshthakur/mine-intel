const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/explorer?target=T-047', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:");
  console.log(text);
  
  await browser.close();
})();
