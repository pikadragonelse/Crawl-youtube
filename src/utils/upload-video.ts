import { existsSync, writeFileSync } from 'fs';
import { Page } from 'puppeteer';
import { sleep } from '../main/util';
import { MailInfo } from '../models/mail';

export const uploadVideo = async (
  page: Page,
  videoPath: string,
  title: string,
) => {
  if (existsSync(videoPath)) {
    try {
      await sleep(5000);
      await page.goto('https://youtube.com/upload');

      const dontHaveChannel = await page
        .waitForSelector('ytd-button-renderer[id="create-channel-button"]', {
          timeout: 10000,
        })
        .then(() => true)
        .catch(() => false);

      if (dontHaveChannel === true) {
        await sleep(1000);
        await page.click('ytd-button-renderer[id="create-channel-button"]');
      }

      const inputFile = await page.waitForSelector('input[type="file"]');
      await inputFile?.uploadFile(videoPath);

      await sleep(1000);
      const isVerify = await page
        .waitForSelector('ytcp-confirmation-dialog', { timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (isVerify === true) {
        await sleep(20000);
        return 'mail dead';
      }
      const titleInput = await page.waitForSelector(
        'ytcp-video-title > ytcp-social-suggestions-textbox > ytcp-form-input-container > div[id="outer"] > div[id="child-input"] > div[id="container-content"] > ytcp-social-suggestion-input > div[id="textbox"]',
        { timeout: 20000 },
      );

      await titleInput?.click({ clickCount: 3 });
      await titleInput?.type(title, { delay: 100 });

      await sleep(8000);
      const linkVideo = await page.evaluate(() => {
        const aElement = document.querySelector(
          "a[class='style-scope ytcp-video-info']",
        );
        if (aElement != null) {
          return aElement.getAttribute('href');
        }
      });

      await sleep(1000);
      await page.click(
        'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"] > div > div[id="offRadio"]',
      );

      await sleep(3000);
      await page.waitForSelector('ytcp-button[id="next-button"]');
      await page.click('ytcp-button[id="next-button"]');

      await sleep(3000);
      await page.waitForSelector('ytcp-button[id="next-button"]');
      await page.click('ytcp-button[id="next-button"]');

      await sleep(5000);
      await page.waitForSelector('ytcp-button[id="next-button"]');
      await sleep(15000);
      await page.click('ytcp-button[id="next-button"]');

      // const isAbandoned = await page.waitForSelector(
      //   'tp-yt-iron-icon[class="remove-defaults step-badge-error style-scope ytcp-stepper"]',
      // );

      // if ((await isAbandoned?.isVisible()) === true) {
      //   await sleep(1000);
      //   return;
      // }

      const publicRadio = await page.waitForSelector(
        'tp-yt-paper-radio-button[name="PUBLIC"] > div > div[id="offRadio"]',
      );
      await publicRadio?.click();

      await sleep(1000);
      await page.click('ytcp-button[id="done-button"]');
      await sleep(20000);
      return linkVideo;
    } catch (error: any) {
      if (
        error.message.includes('Node is either not clickable or not an Element')
      ) {
        return 'unclickable';
      }
    }
  } else {
    return null;
  }
};
