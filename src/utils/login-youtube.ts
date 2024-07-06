import { Page } from 'puppeteer';
import { MailInfo } from '../models/mail';
import { sleep } from '../main/util';
import log from 'electron-log';

export const loginYoutube = async (page: Page, mail: MailInfo) => {
  await page.goto('https://www.youtube.com/');
  const isLogin = await page
    .waitForSelector('a[aria-label="Sign in"]', {
      timeout: 20000,
    })
    .then(() => false)
    .catch(() => true);

  if (isLogin === false) {
    log.info('Not login');
    // Not login?
    await page.click('a[aria-label="Sign in"]');

    // Login form
    await page.waitForSelector('input[name="identifier"]');
    await page.type('input[name="identifier"]', mail.mail, { delay: 100 });
    await sleep(5000);
    await page.evaluate(() => {
      const listButton = document.querySelectorAll(
        'div[data-primary-action-label="Next"] > div > div > div > div > button',
      ) as any;
      if (listButton != null) {
        listButton[0]?.click();
      }
    });

    await sleep(8000);
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', mail.password, { delay: 100 });
    await sleep(2000);

    await page.evaluate(() => {
      const listButton = document.querySelectorAll(
        'div[data-primary-action-label="Next"] > div > div > div > div > button',
      ) as any;
      if (listButton != null) {
        listButton[0]?.click();
      }
    });

    // Check if have to confirm recover mail

    const isConfirmChallenge = await page
      .waitForSelector('div[data-challengeid="5"]', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (isConfirmChallenge === true) {
      await sleep(2000);
      await page.click('div[data-challengeid="5"]');

      await page.waitForSelector('input[type="email"]');
      await sleep(6000);
      await page.type('input[type="email"]', mail.recoverMail, { delay: 100 });

      await sleep(3000);
      await page.evaluate(() => {
        const listButton = document.querySelectorAll(
          'div[data-primary-action-label="Next"] > div > div > div > div > button',
        ) as any;
        if (listButton != null) {
          listButton[0]?.click();
        }
      });
    }

    // Check if need to pass simplify login form
    const isSimplify = await page
      .waitForSelector(
        'div[data-primary-action-label="Continue"] > div > div > div > div > button',
        { timeout: 10000 },
      )
      .then(() => true)
      .catch(() => false);
    if (isSimplify === true) {
      await sleep(3000);
      await page.evaluate(() => {
        const listButton = document.querySelectorAll(
          'div[data-primary-action-label="Continue"] > div > div > div > div > button',
        ) as any;
        if (listButton != null) {
          listButton[1]?.click();
        }
      });
    }
  }
};
