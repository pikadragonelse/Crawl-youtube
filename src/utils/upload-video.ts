import { existsSync } from 'fs';
import { Page } from 'puppeteer';
import { sleep } from '../main/util';

export const uploadVideo = async (
  page: Page,
  videoPath: string,
  title: string,
) => {
  if (existsSync(videoPath)) {
    await sleep(5000);
    await page.goto('https://youtube.com/upload');

    // await sleep(5000);
    // await page.waitForSelector('button[aria-label="Create"]');
    // await sleep(1000);
    // await page.click('button[aria-label="Create"]');
    // await page.waitForSelector('a[href="/upload"]');
    // await sleep(2000);
    // await page.click('a[href="/upload"]');

    const dontHaveChannel = await page
      .waitForSelector('button[aria-label="Create channel"]', {
        timeout: 10000,
      })
      .then(() => true)
      .catch(() => false);

    if (dontHaveChannel === true) {
      await sleep(1000);
      await page.click('button[aria-label="Create channel"]');
    }

    const inputFile = await page.waitForSelector('input[type="file"]');
    await inputFile?.uploadFile(videoPath);

    await sleep(1000);
    const titleInput = await page.waitForSelector(
      'div[aria-label="Add a title that describes your video (type @ to mention a channel)"]',
    );
    await titleInput?.click({ clickCount: 3 });
    await titleInput?.type(title, { delay: 100 });

    await sleep(1000);
    await page.click(
      'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_MFK"] > div > div[id="offRadio"]',
    );

    await sleep(1000);
    await page.click('ytcp-button[id="next-button"]');

    await sleep(1000);
    await page.click('ytcp-button[id="next-button"]');

    await sleep(1000);
    await page.click('ytcp-button[id="next-button"]');

    const publicRadio = await page.waitForSelector(
      'tp-yt-paper-radio-button[name="PUBLIC"] > div > div[id="offRadio"]',
    );
    await publicRadio?.click();

    await sleep(1000);
    await page.click('ytcp-button[id="done-button"]');
  } else {
    return null;
  }
};
