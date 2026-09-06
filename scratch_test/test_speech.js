const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--enable-speech-dispatcher', '--no-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log("Navigating to local app...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  console.log("Waiting for voices to load and selecting T-001...");
  // Wait for React to render and voices to theoretically load
  await new Promise(r => setTimeout(r, 2000));
  
  // We need to inject a script to manually dump the voices since the React hook logged it on play
  const voices = await page.evaluate(() => {
    return window.speechSynthesis.getVoices().map(v => v.name);
  });
  console.log("Voices returned by browser:", voices);
  
  console.log("Clicking on Prospectivity Explorer and T-001...");
  try {
    await page.evaluate(() => {
      // Find T-001 in the list or map
      // Easiest is to force navigation to T-001 if the app supports it, or click the list item
      const listItems = Array.from(document.querySelectorAll('div, span, button')).filter(el => el.textContent.includes('T-001'));
      if (listItems.length > 0) listItems[listItems.length - 1].click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Clicking Listen button...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const listenBtn = buttons.find(b => b.textContent.includes('Listen'));
      if (listenBtn) listenBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Done checking logs. Exiting.");
  } catch (e) {
    console.log("Error interacting with UI:", e);
  }
  
  await browser.close();
})();
