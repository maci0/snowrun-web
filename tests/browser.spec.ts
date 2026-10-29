import {test,expect,type Page} from '@playwright/test';
async function enter(page:Page){
 await page.goto('/');await page.getByRole('button',{name:'Get Started'}).click();
 await page.getByRole('button',{name:'I survive but not black',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Fascination',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Continue without an account'}).click();await page.getByRole('button',{name:"Let's go",exact:true}).click();
 await expect(page.getByRole('heading',{name:'Mt Hutt',exact:true})).toBeVisible();
}
async function yuki(page:Page,name:string){await page.getByRole('button',{name:'Open Yuki menu'}).click();await page.getByRole('button',{name,exact:true}).click();}
test('native colors, original vector styles, simulated recording and saved journal',async({page})=>{
 const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await enter(page);
 await expect(page.locator('.native-banner .primary')).toHaveCSS('background-color','rgb(249, 115, 22)');
 await expect(page.locator('.guide-title h1')).toHaveCSS('color','rgb(11, 47, 94)');
 await page.getByRole('button',{name:'Navigate',exact:true}).click();await expect(page.locator('.trail-row')).toHaveCount(53);
 await page.getByRole('textbox',{name:'Search runs and lifts'}).fill('Summit');await expect(page.locator('.trail-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Start Run',exact:true}).click();await expect(page.getByRole('region',{name:'Current recording'})).toBeVisible();await page.waitForTimeout(2100);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Finish run'}).click();await expect(page.getByRole('heading',{name:'Relive your run'})).toBeVisible();
 await page.reload();await yuki(page,'Journal');await expect(page.locator('.journal-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Back',exact:true}).click();await yuki(page,'Me');await page.getByRole('button',{name:'App Settings'}).click();await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Units',exact:true}).selectOption('mi');await page.reload();await yuki(page,'Me');await page.getByRole('button',{name:'App Settings'}).click();await expect(page.getByRole('combobox',{name:'Units',exact:true})).toHaveValue('mi');
 expect(requests.some(u=>u.includes('tile.openstreetmap.org'))).toBe(false);expect(requests.some(u=>u.includes('map-positron.json'))).toBe(true);expect(errors).toEqual([]);
});
test('account fields never send credentials; all auxiliary screens render',async({page})=>{
 await enter(page);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Forgot Password?'}).click();await expect(page.getByRole('heading',{name:'Forgot Password',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Back',exact:true}).click();await yuki(page,'Me');
 for(const [button,title] of [['App Settings','Settings'],['Account Details','Account Details'],['Subscription','SnowRun Membership'],['Refer Your Friends','Refer Your Friends'],['Challenges','Challenges']] as const){
  await page.getByRole('button',{name:button,exact:false}).first().click();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await page.getByRole('button',{name:'Back',exact:true}).click();await yuki(page,'Me');
 }
});
test('saved map and SQLite survive offline reload',async({page,context})=>{
 test.skip(!process.env.PRODUCTION,'Requires generated production service worker.');await enter(page);await page.getByRole('button',{name:'Save map',exact:true}).click();await expect(page.getByRole('button',{name:'Saved offline',exact:true})).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'Mt Hutt',exact:true})).toBeVisible({timeout:20000});
 await expect(page.getByRole('button',{name:'Saved offline',exact:true})).toBeVisible();
});

test('phone onboarding keeps progress, account content and map controls in native bounds',async({page})=>{
 await page.setViewportSize({width:411,height:838});await page.goto('/');await page.getByRole('button',{name:'Get Started'}).click();
 await page.getByRole('button',{name:'I survive but not black',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:'Fascination',exact:true}).click();await expect(page.locator('.demo-trails polyline[stroke="#7C3AED"]')).toHaveCount(2);
 await page.getByRole('button',{name:'Continue',exact:true}).click();expect((await page.locator('.flow-progress').boundingBox())!.y).toBeLessThan(10);expect((await page.locator('.flow-account-content .yuki-face').boundingBox())!.y).toBeLessThan(130);
 await page.getByRole('button',{name:'Continue without an account'}).click();expect((await page.locator('.flow-progress').boundingBox())!.y).toBeLessThan(10);
 await page.getByRole('button',{name:"Let's go",exact:true}).click();expect((await page.locator('.guide-panel').boundingBox())!.height).toBeLessThan(360);expect((await page.getByRole('button',{name:'Search resorts'}).boundingBox())!.x).toBeLessThan(200);
 await expect(page.getByRole('button',{name:'Center map'})).toBeInViewport();await page.getByRole('button',{name:'Sign in',exact:true}).click();const password=page.locator('input[name=password]');await password.fill('local example');await page.getByRole('button',{name:'Show password'}).click();await expect(password).toHaveAttribute('type','text');await page.getByRole('button',{name:'Hide password'}).click();await expect(password).toHaveAttribute('type','password');
});
