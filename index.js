const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

class Robot {
  constructor() {
    this.page = null;
  }

  async translate(list, from, to) {
    const result = [];
    const sourceBox = '[aria-label="Source text"]';
    const sourceBoxCloseIcon = '[aria-label="Clear source text"]';
    const resultBox = '[data-phrase-index="0"] span';

    puppeteer.launch({ headless: false }).then(async (browser) => {
      this.page = await browser.newPage();
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en'
      });
      await this.page.setViewport({ width: 1366, height: 2000 });
      await this.page.goto(
        `https://translate.google.com/?sl=${from}&tl=${to}&op=translate`,
        {
          waitUntil: "domcontentloaded",
        }
      );
      await this.delayer(7000);

      for (let item of list) {
        await this.page.click(sourceBox);
        await this.page.type(sourceBox, item);
        await this.delayer(3000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const translatedText = $(resultBox).text().trim();
        result.push(translatedText.replace("Try again", ""));
        await this.page.click(sourceBoxCloseIcon);
        await this.delayer(500);
      }

      this.saveResult(result);
    });
    return result;
  }

  saveResult(result) {
    fs.writeFile("translations.txt", JSON.stringify(result), async (err) => {
      console.log(err ? "Something went wrong!" : "Results are saved!");
      await this.page.close();
      process.exit();
    });
  }

  delayer(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}

const translationRobot = new Robot();
translationRobot.translate(["Car", "Truck", "Bike", "Ship"], "en", "tr");
