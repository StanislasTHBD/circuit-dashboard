import puppeteer from 'puppeteer';

async function scrapeData() {
  const url = "https://www.circuitdecroix.com/produit/essais-libres-moto-vendredi-lundi/";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const data = [];

  // Les différents niveaux de pilote à tester
  const niveauxPilote = [
    "Débutant (tour sup. 1.10')",
    "Intermédiaire (tour entre 1.05' et 1.10')",
    "Confirmé (tour entre 1.01' et 1.05')",
    "Expert (tour inf. à 1.01')"
  ];

  for (const niveau of niveauxPilote) {
    // On visite la page pour chaque niveau de pilote
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#niveau-du-pilote");

    // Sélection du "Niveau du pilote"
    await page.evaluate((niveauText) => {
      const select = document.getElementById("niveau-du-pilote");
      if (select) {
        const option = Array.from(select.options).find(
          (opt) => opt.text.trim() === niveauText
        );
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }, niveau);

    // Sélection "Non" pour "Etes-vous membre de l'ASM Circuit de Croix ?"
    await page.evaluate(() => {
      const membreSelect = document.getElementById("etes-vous-membre-de-lasm-circuit-de-croix");
      if (membreSelect) {
        const option = Array.from(membreSelect.options).find(
          (opt) => opt.text.trim() === "Non"
        );
        if (option) {
          membreSelect.value = option.value;
          membreSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    // Sélection "Non" pour "Souhaitez-vous l'assurance annulation ?"
    await page.evaluate(() => {
      const assuranceSelect = document.getElementById("souhaitez-vous-lassurance-annulation");
      if (assuranceSelect) {
        const option = Array.from(assuranceSelect.options).find(
          (opt) => opt.text.trim() === "Non"
        );
        if (option) {
          assuranceSelect.value = option.value;
          assuranceSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    // On attend un petit délai pour laisser le site réagir aux changements
    await new Promise((r) => setTimeout(r, 2000));

    // On récupère les différentes dates disponibles
    const dates = await page.evaluate(() => {
      const select = document.getElementById("dates");
      if (!select) return [];
      return Array.from(select.options)
        .filter((opt) => opt.value)
        .map((opt) => opt.textContent.trim());
    });

    // Pour chaque date, on la sélectionne et on récupère le stock
    for (const date of dates) {
      await page.evaluate((dateText) => {
        const select = document.getElementById("dates");
        if (select) {
          const option = Array.from(select.options).find(
            (opt) => opt.textContent.trim() === dateText
          );
          if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }, date);

      // On laisse encore un petit délai pour que le stock se mette à jour
      await new Promise((r) => setTimeout(r, 1000));

      // On extrait le texte de stock
      const stock = await page.evaluate(() => {
        const stockText = document.querySelector("p.stock");
        return stockText ? stockText.textContent.trim() : "Non dispo";
      });

      data.push({
        NiveauDuPiloteVendrediLundi: niveau,
        DateVendrediLundi: date,
        StockVendrediLundi: stock,
      });
    }
  }

  await browser.close();
  return data;
}

export default scrapeData;
