import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.ts',timeout:90000,use:{baseURL:process.env.BASE_URL||'http://localhost:5178',viewport:{width:1440,height:1000},launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},reporter:'list'});
