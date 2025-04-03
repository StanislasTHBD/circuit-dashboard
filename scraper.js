import puppeteer from 'puppeteer';

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = "https://www.circuitdecroix.com/produit/club-moto-loisir/";

  const data = [];
  const pilotes = ["Gentlemen Rider", "Grands Débutants"];

  for (const pilote of pilotes) {
    await page.goto(url);
    await page.waitForSelector("#niveau-du-pilote");

    await page.evaluate((pilote) => {
      const select = document.getElementById("niveau-du-pilote");
      const option = Array.from(select.options).find(opt => opt.text.trim() === pilote);
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, pilote);

    await new Promise(r => setTimeout(r, 2000));

    const dates = await page.evaluate(() => {
      const select = document.getElementById("dates");
      return Array.from(select.options)
        .filter(opt => opt.value)
        .map(opt => opt.textContent.trim());
    });

    for (const date of dates) {
      await page.evaluate((dateText) => {
        const select = document.getElementById("dates");
        const option = Array.from(select.options).find(opt => opt.textContent.trim() === dateText);
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, date);

      await new Promise(r => setTimeout(r, 1000));

      const stock = await page.evaluate(() => {
        const stockText = document.querySelector("p.stock");
        return stockText ? stockText.textContent.trim() : "Non dispo";
      });

      data.push({ Pilote: pilote, Date: date, Stock: stock });
    }
  }

  await browser.close();
  return data;
}

export default scrapeData;
