const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new', // or true if 'new' is not supported by the version
            defaultViewport: { width: 1920, height: 1080 }
        });
        const page = await browser.newPage();
        
        console.log('Navigating to local dashboard...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
        
        await delay(5000); // give it time to render the default dashboard

        const outputDir = path.resolve(__dirname, '../images');
        
        // Helper to click an item by its text content
        const clickSidebarItem = async (text) => {
            const elements = await page.$x(`//span[contains(text(), '${text}')]`);
            if (elements.length > 0) {
                await elements[0].click();
                await delay(2000); // wait for modal or dashboard to update
                return true;
            }
            return false;
        };

        const expandCategory = async (categoryText) => {
             const elements = await page.$x(`//span[contains(text(), '${categoryText}')]`);
             if (elements.length > 0) {
                await elements[0].click();
                await delay(500);
             }
        };

        console.log('Capturing Main Telemetry...');
        await page.screenshot({ path: path.join(outputDir, 'page01.png') });
        await page.screenshot({ path: path.join(outputDir, 'page03.png') }); // Main Telemetry is also page03

        console.log('Expanding Categories...');
        await expandCategory('1. Historical Analysis');
        await expandCategory('3. Lap Data & Long Run');
        await expandCategory('4. Ideal Lap Analysis');
        await expandCategory('5. Performance Evaluation');
        await expandCategory('6. AI Prediction Models');
        await expandCategory('7. Multi-Season Analysis');
        await expandCategory('8. Live Timing');

        console.log('Capturing Historical Analysis (Temperature)...');
        if (await clickSidebarItem('Temperature Analysis')) {
            await page.screenshot({ path: path.join(outputDir, 'page02.png') });
        }

        console.log('Capturing Lap Data...');
        if (await clickSidebarItem('Detailed Lap Data')) {
            await page.screenshot({ path: path.join(outputDir, 'page04.png') });
        }

        console.log('Capturing Ideal Lap...');
        if (await clickSidebarItem('Sector Reconstruction')) {
            await page.screenshot({ path: path.join(outputDir, 'page05.png') });
        }

        console.log('Capturing Straight Line Speed...');
        if (await clickSidebarItem('Straight Line Speed')) {
            await page.screenshot({ path: path.join(outputDir, 'page06.png') });
        }

        console.log('Capturing Performance Eval (Corner Class)...');
        if (await clickSidebarItem('Corner Classification')) {
            await page.screenshot({ path: path.join(outputDir, 'page07.png') });
        }

        console.log('Capturing Performance Eval (Brake & Accel)...');
        if (await clickSidebarItem('Brake & Accel')) {
            await page.screenshot({ path: path.join(outputDir, 'page08.png') });
        }

        console.log('Capturing AI Predictions...');
        if (await clickSidebarItem('Qualifying Predictions')) {
            await page.screenshot({ path: path.join(outputDir, 'page09.png') });
        }

        console.log('Capturing Multi Season (Historical Track Map)...');
        if (await clickSidebarItem('Historical Track Map')) {
            await page.screenshot({ path: path.join(outputDir, 'page10.png') });
        }
        
        console.log('Capturing Multi Season (Season Start Reaction)...');
        if (await clickSidebarItem('Season Start Reaction')) {
            await page.screenshot({ path: path.join(outputDir, 'page11.png') });
        }

        console.log('Capturing Live Timing...');
        if (await clickSidebarItem('Ranking Tower')) {
            await page.screenshot({ path: path.join(outputDir, 'page12.png') });
            await page.screenshot({ path: path.join(outputDir, 'page13.png') });
            await page.screenshot({ path: path.join(outputDir, 'page14.png') });
            await page.screenshot({ path: path.join(outputDir, 'page15.png') });
            await page.screenshot({ path: path.join(outputDir, 'page16.png') });
        }

        await browser.close();
        console.log('Done!');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
