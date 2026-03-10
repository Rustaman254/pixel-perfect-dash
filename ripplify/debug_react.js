const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
  console.log('Navigating to http://localhost:8080');
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  const rootHTML = await page.$eval('#root', el => el.innerHTML).catch(() => 'no root');
  console.log('ROOT_HTML length:', rootHTML.length);
  await browser.close();
  console.log('Done.');
})();
