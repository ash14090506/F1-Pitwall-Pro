const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            defaultViewport: { width: 1920, height: 1080 }
        });
        const page = await browser.newPage();
        
        console.log('Navigating to local dashboard...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
        
        await delay(5000); // give it time to render the default dashboard

        const outputDir = path.resolve(__dirname, 'images');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        const clickXPath = async (xpath) => {
            try {
                // Wait for the element just in case
                await page.waitForXPath(xpath, { timeout: 2000 });
                const elements = await page.$x(xpath);
                if (elements.length > 0) {
                    await elements[0].click();
                    await delay(2000);
                    return true;
                }
            } catch (e) {
                console.log("Failed to click: " + xpath);
            }
            return false;
        };

        console.log('Capturing Main Telemetry...');
        await page.screenshot({ path: path.join(outputDir, 'page01.png') });
        await page.screenshot({ path: path.join(outputDir, 'page03.png') });

        console.log('Expanding Categories...');
        // The span is inside a div with onClick. We click the parent div.
        await clickXPath("//span[contains(text(), '1. Historical Analysis')]/..");
        await clickXPath("//span[contains(text(), '3. Lap Data & Long Run')]/..");
        await clickXPath("//span[contains(text(), '4. Ideal Lap Analysis')]/..");
        await clickXPath("//span[contains(text(), '5. Performance Evaluation')]/..");
        await clickXPath("//span[contains(text(), '6. AI Prediction Models')]/..");
        await clickXPath("//span[contains(text(), '7. Multi-Season Analysis')]/..");
        await clickXPath("//span[contains(text(), '8. Live Timing')]/..");

        await delay(1000);

        console.log('Capturing Historical Analysis (Temperature)...');
        if (await clickXPath("//span[contains(text(), 'Temperature Analysis')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page02.png') });
        }

        console.log('Capturing Lap Data...');
        if (await clickXPath("//span[contains(text(), 'Detailed Lap Data')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page04.png') });
        }

        console.log('Capturing Ideal Lap...');
        if (await clickXPath("//span[contains(text(), 'Sector Reconstruction')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page05.png') });
        }

        console.log('Capturing Straight Line Speed...');
        if (await clickXPath("//span[contains(text(), 'Straight Line Speed')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page06.png') });
        }

        console.log('Capturing Performance Eval (Corner Class)...');
        if (await clickXPath("//span[contains(text(), 'Corner Classification')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page07.png') });
        }

        console.log('Capturing Performance Eval (Brake & Accel)...');
        if (await clickXPath("//span[contains(text(), 'Brake & Accel')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page08.png') });
        }

        console.log('Capturing AI Predictions...');
        if (await clickXPath("//span[contains(text(), 'Qualifying Predictions')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page09.png') });
        }

        console.log('Capturing Multi Season (Historical Track Map)...');
        if (await clickXPath("//span[contains(text(), 'Historical Track Map')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page10.png') });
        }
        
        console.log('Capturing Multi Season (Season Start Reaction)...');
        if (await clickXPath("//span[contains(text(), 'Season Start Reaction')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page11.png') });
        }

        console.log('Capturing Live Timing...');
        if (await clickXPath("//span[contains(text(), 'Ranking Tower')]/..")) {
            await page.screenshot({ path: path.join(outputDir, 'page12.png') });
            // Copy it to the others since they are similar placeholders
            fs.copyFileSync(path.join(outputDir, 'page12.png'), path.join(outputDir, 'page13.png'));
            fs.copyFileSync(path.join(outputDir, 'page12.png'), path.join(outputDir, 'page14.png'));
            fs.copyFileSync(path.join(outputDir, 'page12.png'), path.join(outputDir, 'page15.png'));
            fs.copyFileSync(path.join(outputDir, 'page12.png'), path.join(outputDir, 'page16.png'));
        }

        await browser.close();
        console.log('Done!');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
