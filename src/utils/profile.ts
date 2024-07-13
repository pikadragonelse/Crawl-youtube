import { execSync } from 'child_process';
import {
  existsSync,
  mkdir,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import log from 'electron-log';
import path from 'path';
import {
  CreateProfileInfo,
  defaultProfileItem,
  ProfileItem,
} from '../models/profile';
import axios from 'axios';
import { getIp } from './proxy';
import { sleep } from '../main/util';

const APP_DATA_PATH = execSync('echo %APPDATA%').toString().trim();

function randomString(len: number, charSet?: string) {
  charSet =
    charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

export async function createProfile(email: string) {
  var profile: ProfileItem = {
    ...defaultProfileItem,
    email: email,
  };

  const PROFILE_PATH = path.join(
    APP_DATA_PATH,
    'Youtube-Profiles/' + profile.email,
  );
  log.info('profile_path: ' + PROFILE_PATH);
  if (!existsSync(PROFILE_PATH)) mkdir(PROFILE_PATH, () => {});
  if (!existsSync(PROFILE_PATH + '/Default'))
    mkdir(PROFILE_PATH + '/Default', () => {});
  const PREFERENCE_PATH = path.join(path.resolve(), 'References');
  log.info('PREFERENCE_PATH: ' + PREFERENCE_PATH);
  var files = readdirSync(PREFERENCE_PATH);
  // get base preferences
  var base_preference = JSON.parse(
    readFileSync(
      path.join(
        PREFERENCE_PATH,
        files[Math.floor(Math.random() * files.length)],
      ),
    ) as any,
  );
  const FINGER_PATH = path.join(path.resolve(), 'Finger');
  log.info('FINGER_PATH: ' + FINGER_PATH);
  files = readdirSync(FINGER_PATH);
  var base_finger = JSON.parse(
    readFileSync(
      path.join(FINGER_PATH, files[Math.floor(Math.random() * files.length)]),
    ) as any,
  );

  base_preference['gologin']['name'] = profile['email'];
  base_preference['browser']['window_placement']['maximized'] = false;
  base_preference['gologin']['mobile']['device_scale_factor'] = 1;
  base_preference['gologin']['startupUrl'] = '';
  base_preference['gologin']['startup_urls'][0] = '';

  if (!base_finger) {
    log.info('base finger null');
    return null;
  }
  base_preference['autocomplete']['retention_policy_last_version'] = 120;
  base_preference['extensions']['last_chrome_version'] = '120.0.6099.110';
  base_preference['gologin']['navigator']['platform'] = 'Win32';
  base_preference['gologin']['userAgent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.110 Safari/537.36';
  base_preference['gologin']['hardwareConcurrency'] =
    base_finger['navigator']['hardwareConcurrency'];
  base_preference['gologin']['navigator']['max_touch_points'] =
    base_finger['navigator']['maxTouchPoints'];
  base_preference['gologin']['canvasMode'] = 'off';
  base_preference['gologin']['canvasNoise'] = base_finger['canvasNoise'];
  base_preference['gologin']['mediaDevices'] = base_finger['mediaDevices'];
  base_preference['gologin']['mediaDevices']['uid'] = randomString(58);
  base_preference['gologin']['mediaDevices']['enable'] = true;

  base_preference['gologin']['webGl']['mode'] =
    base_finger['webGLMetadata']['mode'];
  base_preference['gologin']['webGl']['renderer'] =
    base_finger['webGLMetadata']['renderer'];
  base_preference['gologin']['webGl']['vendor'] =
    base_finger['webGLMetadata']['vendor'];
  base_preference['gologin']['webgl']['metadata']['mode'] =
    base_finger['webGLMetadata']['mode'];
  base_preference['gologin']['webgl']['metadata']['renderer'] =
    base_finger['webGLMetadata']['renderer'];
  base_preference['gologin']['webgl']['metadata']['vendor'] =
    base_finger['webGLMetadata']['vendor'];
  base_preference['gologin']['webglParams'] = base_finger['webglParams'];
  base_preference['profile']['content_settings']['exceptions']['local_fonts'] =
    base_finger['fonts'];

  base_preference = JSON.stringify(base_preference, null, 4); // Indented 4 spaces
  try {
    writeFileSync(
      path.join(
        APP_DATA_PATH,
        'Youtube-Profiles',
        profile.email,
        'Default\\Preferences',
      ),
      base_preference,
    );
    // await sleep(300000);
  } catch (error) {
    log.info('write file sync error');
    log.info(error);
    return null;
  }
  return profile;
}

export async function fakeLocation(profile: ProfileItem, staticProxy = true) {
  const preference_path = path.join(
    APP_DATA_PATH,
    'Youtube-Profiles',
    profile.email,
    'Default\\Preferences',
  );

  let preferences: any = readFileSync(preference_path, 'utf-8');
  try {
    preferences = JSON.parse(preferences);
  } catch (e) {
    log.info(e);
    throw e;
  }
  let locationHost = 'http://ip-api.com/json';
  if (staticProxy && profile.parsedProxy) {
    const ip = await getIp(profile.parsedProxy);
    if (ip != null) {
      locationHost = `http://ip-api.com/json/${ip}`;
    } else {
      throw new Error('Cannot get id proxy');
    }
  }
  let temp = await axios.get(locationHost);
  let location = temp.data;
  log.info('Location: ', location);
  try {
    preferences['autocomplete']['retention_policy_last_version'] = 120;
    preferences['extensions']['last_chrome_version'] = '120.0.6099.110';
    if (!('gologin' in preferences)) {
      await createProfile(profile.email);
    }
    preferences['gologin']['navigator']['platform'] = 'Win32';
    preferences['gologin']['userAgent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.110 Safari/537.36';

    preferences['gologin']['timezone']['id'] = location.timezone;
    preferences['gologin']['geoLocation']['latitude'] =
      location.lat + getRandomFloat(0.0001, 0.001, 4);
    preferences['gologin']['geoLocation']['longitude'] =
      location.lon + getRandomFloat(0.0001, 0.001, 4);
    preferences['gologin']['languages'] = 'en-US,en';
    if ('webRtc' in preferences['gologin']) {
      preferences['gologin']['webRtc']['enable'] = 'disabled';
    }
    if ('webrtc' in preferences['gologin']) {
      preferences['gologin']['webrtc']['mode'] = 'disabled';
    }
    if (profile.proxyHost && profile.proxyUser) {
      preferences['gologin']['proxy']['username'] = profile.proxyUser;
      preferences['gologin']['proxy']['password'] = profile.proxyPass;
    }
    preferences = JSON.stringify(preferences, null, 4); // Indented 4 spaces
    writeFileSync(preference_path, preferences);
  } catch (error) {
    console.log(error);
    log.error('Profiles utils > Fake location error: ', error);
  }
}

export function getRandomFloat(min: number, max: number, decimals: any) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);

  return parseFloat(str);
}
