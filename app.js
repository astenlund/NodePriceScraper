/* jshint esversion: 6 */

const argv      = require('yargs').array('isbn').argv;
const puppeteer = require('puppeteer');

const headless = argv.headless || false;
const isbns    = argv.isbn;

async function main() {
    const browser = await puppeteer.launch({ headless: headless });

    for (isbn of isbns) {
        // Use strategy pattern for these values
        const url           = `https://www.ark.no/search/?text=${isbn}`;
        const readySelector = '#content';
        const priceSelector = '#content div.priceNow > div.item-price';

        await extractPrice(browser, url, readySelector, priceSelector)
            .then(console.log)
            .catch(console.error);
    }

    await browser.close();
}

async function extractPrice(browser, url, readySelector, priceSelector) {
    const page = await browser.newPage();

    await blockImages(page);
    await page.goto(url);
    await page.waitForSelector(readySelector);

    const price = await page.$eval(priceSelector, priceDiv => {
        return priceDiv.textContent.trim();
    });

    await page.close();

    return { isbn: isbn, price: price };
}

async function blockImages(page) {
    await page.setRequestInterception(true);

    page.on('request', request => {
        request.resourceType === 'image'
            ? request.abort()
            : request.continue();
    });
}

main();
