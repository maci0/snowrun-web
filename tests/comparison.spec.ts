import {test,expect,type Page} from '@playwright/test';
async function seedRuns(page:Page){
 await page.goto('/');await page.getByRole('button',{name:'Get Started'}).click();
 await page.getByRole('button',{name:'I survive but not black',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Fascination',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Continue without an account'}).click();await page.getByRole('button',{name:"Let's go",exact:true}).click();
 await expect(page.locator('.shell')).toBeVisible();
 // Seed the real SQLite store through its development module.
 await page.evaluate(async()=>{
  const path='/src/db.ts',SQL=await import(/* @vite-ignore */ path);
  for(const [key,value] of [['tip-resort','hidden'],['tip-journal','hidden'],['tip-friends','hidden'],['tip-rewards','hidden']])await SQL.setSetting(key,value);
  for(let i=0;i<2;i++)await SQL.saveRun({id:'comparison-'+i,resort:'Mt Hutt',name:'Run '+i,started:1700000000000+i*100000,duration:10,distance:400,topSpeed:30,descent:50,snowmiles:2,points:Array.from({length:11},(_,n)=>({lng:171.54+n*.0001,lat:-43.495+n*.0001+i*.0002,altitude:1700-n*5,time:1700000000000+i*100000+n*1000,speed:20+n}))});
 });
 await page.reload();await page.getByRole('button',{name:'Open Yuki menu'}).click();await page.getByRole('button',{name:'Journal',exact:true}).click();
}
test('comparison replays selected SQLite runs in sync and cleans up on exit',async({page})=>{
 test.skip(!!process.env.PRODUCTION,'Fixture imports the development SQLite module.');await page.setViewportSize({width:411,height:838});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seedRuns(page);
 await page.getByRole('button',{name:'Compare',exact:true}).click();await page.locator('[data-compare-id]').nth(0).click();await expect(page.locator('[data-compare-id]').nth(0)).toBeChecked();await page.locator('[data-compare-id]').nth(1).click();await expect(page.locator('[data-compare-id]').nth(1)).toBeChecked();await page.getByRole('button',{name:'Compare 2 Runs',exact:true}).click();
 await expect(page.locator('.native-comparison')).toBeVisible();await expect(page.locator('#map')).toHaveAttribute('aria-busy','false');
 await page.getByRole('button',{name:'Expand comparison statistics'}).click();await expect(page.locator('.nc-stat')).toHaveCount(3);await expect(page.locator('[aria-label="Run 1 replay location"]')).toBeVisible();await expect(page.locator('[aria-label="Run 2 replay location"]')).toBeVisible();
 await page.locator('#comparison-position').fill('5');await page.locator('#comparison-position').dispatchEvent('input');await expect(page.locator('#comparison-time')).toHaveText('00:05');
 await page.getByRole('button',{name:'Play comparison'}).click();await expect.poll(async()=>Number(await page.locator('#comparison-position').inputValue())).toBeGreaterThan(5);await page.getByRole('button',{name:'Pause comparison'}).click();
 const paused=Number(await page.locator('#comparison-position').inputValue());await page.waitForTimeout(150);expect(Number(await page.locator('#comparison-position').inputValue())).toBe(paused);
 await page.getByRole('button',{name:'16x',exact:true}).click();await expect(page.getByRole('button',{name:'16x',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('.native-comparison')).toHaveCount(0);await expect(page.locator('[aria-label="Run 1 replay location"]')).toHaveCount(0);expect(errors).toEqual([]);
});

test('journal trip selection renders its saved runs',async({page})=>{
 test.skip(!!process.env.PRODUCTION,'Fixture imports the development SQLite module.');await seedRuns(page);await page.getByRole('tab',{name:'Trips',exact:true}).click();await expect(page.locator('.na-native-trip')).toHaveCount(1);await page.locator('.na-native-trip').click();await expect(page.locator('.na-trip-header h1')).toHaveText('Mt Hutt');await expect(page.locator('.na-trip-days [data-run]')).toHaveCount(2);
});
