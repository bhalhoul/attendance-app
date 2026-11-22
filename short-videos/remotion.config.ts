import { Config } from '@remotion/cli/config';
import fs from 'node:fs';

Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(16);
// متصفح محلي إلا كان موجود (REMOTION_BROWSER)، وإلا Remotion كيحمّل واحد بوحدو
const browser = process.env.REMOTION_BROWSER;
if (browser && fs.existsSync(browser)) Config.setBrowserExecutable(browser);
