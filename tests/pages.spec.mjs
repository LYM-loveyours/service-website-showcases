import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
for(const trade of ['estate-agent','accountant']){
 for(const file of fs.readdirSync('sites/'+trade).filter(f=>f.endsWith('.html'))){
  test(`${trade}/${file}: accessibility, assets, layout`,async({page},info)=>{
   const errors=[];const missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
   await page.goto(`/sites/${trade}/${file}`);await page.evaluate(()=>document.fonts.ready);
   await expect(page.locator('h1')).toHaveCount(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
   expect(errors).toEqual([]);expect(missing).toEqual([]);
   const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
   await page.screenshot({path:`docs/screenshots/${trade}-${file.replace('.html','')}-${info.project.name}.png`});
  });
 }
}
