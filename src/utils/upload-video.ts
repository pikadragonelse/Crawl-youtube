import { existsSync, writeFileSync } from 'fs';
import { Page } from 'puppeteer';
import { sleep } from '../main/util';
import path from 'path';
import { loadJSONFile } from './load-file';
import log from 'electron-log';

export const uploadVideo = async (
  page: Page,
  videoPath: string,
  title: string,
  mail: string,
) => {
  if (existsSync(videoPath)) {
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
    // const isVerify = await page
    //   .waitForSelector('tp-yt-paper-dialog[id="dialog"]', { timeout: 10000 })
    //   .then(() => true)
    //   .catch(() => false);

    // if (isVerify === true) {
    //   await sleep(20000);
    //   return 'mail dead';
    // }
    const titleInput = await page.waitForSelector(
      'ytcp-video-title > ytcp-social-suggestions-textbox > ytcp-form-input-container > div[id="outer"] > div[id="child-input"] > div[id="container-content"] > ytcp-social-suggestion-input > div[id="textbox"]',
      { timeout: 20000 },
    );

    await titleInput?.click({ clickCount: 3 });
    await titleInput?.type(title, { delay: 100 });

    await sleep(1000);
    const linkVideo = await page.evaluate(() => {
      const aElement = document.querySelector(
        "a[class='style-scope ytcp-video-info']",
      );
      if (aElement != null) {
        return aElement.getAttribute('href');
      }
    });

    log.info(linkVideo);

    if (linkVideo != null) {
      const dataFilePath = path.join(
        path.resolve(),
        'Data-JSON/uploaded-channel.json',
      );
      let uploadedMap: Record<string, Array<string>> = loadJSONFile(
        dataFilePath,
      ) || {};
      if (uploadedMap[mail] != null) {
        uploadedMap[mail].push(linkVideo);
      } else {
        uploadedMap[mail] = [linkVideo];
      }
      writeFileSync(dataFilePath, JSON.stringify(uploadedMap, null, 2));
    }

    await sleep(1000);
    await page.click(
      'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"] > div > div[id="offRadio"]',
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
    await sleep(20000);
  } else {
    return null;
  }
};
