// Browser checks for the built static site. Use --live after GitHub Pages deploys.
// Dependencies: playwright and axe-core. Set CAREER_QA_BROWSER_CHANNEL to use an installed browser.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const dep=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||path.resolve(path.dirname(process.execPath),'../node_modules');
function dependency(name){try{return require(name)}catch{return require(require.resolve(name,{paths:[dep,process.env.CAREER_QA_NODE_MODULES||dep]}))}}
const {chromium}=dependency('playwright');
const axePath=require.resolve('axe-core/axe.min.js',{paths:[root,dep,process.env.CAREER_QA_NODE_MODULES||dep]});
const output=process.env.CAREER_QA_OUTPUT||path.join(root,'qa-output');fs.mkdirSync(output,{recursive:true});
const live=process.argv.includes('--live');
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'islaclean')).filter(f=>f.endsWith('.html')).map(f=>'islaclean/'+f));
const report={mode:live?'live':'local',pages:pages.length,viewports:[],accessibility:[],failures:[],external:[],downloads:[],timings:[],checks:[]};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.csv':'text/csv','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xml':'application/xml','.txt':'text/plain'};
const server=http.createServer((req,res)=>{try{let route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(route.endsWith('/'))route+='index.html';const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(500);res.end()}});
const failures=(label,message)=>report.failures.push({label,message});
(async()=>{
 let browser;
 try{
  if(!live)await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=live?'https://ericcruzdigital.github.io/':`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CAREER_QA_BROWSER_CHANNEL?{channel:process.env.CAREER_QA_BROWSER_CHANNEL}:{}),headless:true});
  const context=await browser.newContext({reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>failures('JavaScript',e.message));
  const internal=new Set(),external=new Set(),downloads=new Set(),metadata=[];
  for(const width of [1365,768,390,320]){
   await page.setViewportSize({width,height:900});
   for(const file of pages){
    const response=await page.goto(base+file,{waitUntil:'networkidle',timeout:30000});
    if(!response||response.status()!==200)failures(file,`HTTP ${response?.status()}`);
    if(live&&width===1365&&response){const actual=(await response.text()).replace(/\r\n/g,'\n');const expected=fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');if(actual!==expected)failures(file,'Live HTML does not match the published source');}
    const data=await page.evaluate(()=>{
     const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(x=>({level:Number(x.tagName[1]),text:x.textContent.trim()}));
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,headings:hs,title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,og:document.querySelector('meta[property="og:url"]')?.content,robots:document.querySelector('meta[name="robots"]')?.content,lang:document.documentElement.lang,main:document.querySelectorAll('main').length,ids:[...document.querySelectorAll('[id]')].map(x=>x.id),links:[...document.querySelectorAll('a[href]')].map(a=>({href:a.href,download:a.hasAttribute('download'),text:a.textContent.trim()||a.getAttribute('aria-label')||a.querySelector('img')?.alt})),images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0,alt:i.getAttribute('alt'),width:i.getAttribute('width'),height:i.getAttribute('height')})),json:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),text:document.body.innerText,metrics:{load:performance.getEntriesByType('navigation')[0]?.duration}};
    });
    if(data.overflow)failures(`${file}@${width}`,'Horizontal page overflow');
    if(data.headings.filter(h=>h.level===1).length!==1)failures(file,'Expected one H1');
    if(data.main!==1||data.lang!=='en')failures(file,'Missing main landmark or language');
    for(let i=1;i<data.headings.length;i++)if(data.headings[i].level>data.headings[i-1].level+1)failures(file,'Heading skip: '+data.headings[i].text);
    if(new Set(data.ids).size!==data.ids.length)failures(file,'Duplicate IDs');
    for(const img of data.images)if(!img.ok||img.alt===null)failures(file,'Image load/alt issue '+img.src);
    if(/salary expectations|desired hourly rate|financial insecurity/i.test(data.text))failures(file,'Private job-search content');
    if(width===1365){
     metadata.push({file,...data});
     for(const l of data.links){if(l.href.startsWith(base)){internal.add(l.href);if(l.download)downloads.add(l.href)}else if(/^https:/.test(l.href))external.add(l.href);if(!l.text)failures(file,'Empty link text');}
     if(file!=='404.html'){
      const expected='https://ericcruzdigital.github.io/'+file.replace(/(?:^|\/)index\.html$/,m=>m.startsWith('/')?'/':'');
      if(!data.description||data.canonical!==expected)failures(file,'Missing description or incorrect canonical');
      if(!file.startsWith('islaclean/')&&(data.og!==expected||!data.json.length))failures(file,'Missing social URL or schema');
      if(file.startsWith('islaclean/')&&!data.robots?.includes('noindex'))failures(file,'Practice page must remain noindex');
     }
     report.timings.push({file,loadMilliseconds:Math.round(data.metrics.load)});
    }
    if(width===1365||width===390){
     await page.addScriptTag({path:axePath});
     const axe=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
     const violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
     report.accessibility.push({file,width,violations});
     for(const v of violations)failures(`${file}@${width}`,`axe ${v.id}: ${JSON.stringify(v.nodes)}`);
    }
    if(['index.html','resume.html','evidence.html','case-local-seo.html','case-operations.html','case-content-publishing.html'].includes(file)&&(width===1365||width===390))await page.screenshot({path:path.join(output,`${live?'live-':''}${file.replace('.html','')}-${width}.png`),fullPage:file!=='index.html'});
   }
   report.viewports.push(width);console.log(`Checked ${pages.length} pages at ${width}px`);
  }
  const titles=metadata.filter(x=>x.file!=='404.html').map(x=>x.title),descriptions=metadata.filter(x=>x.file!=='404.html').map(x=>x.description);
  if(new Set(titles).size!==titles.length||new Set(descriptions).size!==descriptions.length)failures('metadata','Duplicate title or description');
  for(const url of internal){
   const u=new URL(url),fragment=decodeURIComponent(u.hash.slice(1));u.hash='';
   const response=await context.request.get(u.href);
   if(response.status()!==200)failures('internal link',url+' HTTP '+response.status());
   if(fragment){const html=await response.text();if(!html.includes(`id="${fragment}"`))failures('fragment',url)}
  }
  for(const url of downloads){
   const response=await context.request.get(url),buffer=await response.body();const relative=new URL(url).pathname.slice(1);
   assert.equal(response.status(),200);assert.ok(buffer.equals(fs.readFileSync(path.join(root,relative))),'Download mismatch: '+url);
   if(url.endsWith('.docx'))assert.equal(buffer.subarray(0,2).toString(),'PK');
   report.downloads.push({url,bytes:buffer.length,exactMatch:true});
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base);
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').innerText(),'Skip to content');
  await page.locator('[data-menu-button]').click();assert.equal(await page.locator('[data-menu-button]').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-menu-button]').getAttribute('aria-expanded'),'false');
  await page.locator('[data-menu-button]').click();await page.locator('#site-nav a').first().click();assert.equal(await page.locator('[data-menu-button]').getAttribute('aria-expanded'),'false');
  report.checks.push('Skip link, mobile menu, Escape focus return and navigation');
  await page.goto(base+'resume.html');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download Word résumé',exact:true}).first().click()]);
  assert.equal(download.suggestedFilename(),'Eric_John_Cruz_Resume.docx');assert.equal(await download.failure(),null);
  report.checks.push('Actual Word download interaction');
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.resume-toolbar').isVisible(),false);assert.ok((await page.locator('main').innerText()).includes('Registered Electrical Engineer'));await page.emulateMedia({media:'screen'});
  await page.goto(base+'islaclean/contact.html');let postCount=0;page.on('request',r=>{if(r.method()==='POST')postCount++});
  await page.getByLabel('Name',{exact:true}).fill('Demo visitor');await page.getByLabel('Service',{exact:true}).selectOption({label:'Deep Cleaning'});await page.getByLabel('Message',{exact:true}).fill('Demo test');await page.getByRole('button',{name:'Submit demo request'}).click();
  assert.ok((await page.locator('[data-form-status]').innerText()).includes('no personal information'));assert.equal(await page.getByLabel('Name',{exact:true}).inputValue(),'');assert.equal(postCount,0);
  const events=await page.evaluate(()=>window.dataLayer);assert.ok(events.some(e=>e.event==='demo_form_submit'));assert.ok(events.every(e=>!JSON.stringify(e).includes('Demo visitor')));
  report.checks.push('Demo form confirmation, reset, local events and no data transmission');
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const np=await nojs.newPage();await np.goto(base);assert.equal(await np.locator('#site-nav').isVisible(),true);await np.goto(base+'islaclean/contact.html');assert.equal(await np.getByRole('button',{name:'Submit demo request'}).isDisabled(),true);await nojs.close();
  report.checks.push('No-JavaScript navigation and safely disabled demo form');
  for(const url of external){try{const r=await context.request.get(url,{timeout:20000});report.external.push({url,status:r.status(),verified:r.ok()});}catch(e){report.external.push({url,verified:false,reason:e.message.split('\n')[0]});}}
  for(const file of ['robots.txt','sitemap.xml']){const r=await context.request.get(base+file);assert.equal(r.status(),200);const content=await r.text();assert.equal(content,fs.readFileSync(path.join(root,file),'utf8'));}
  report.checks.push('Robots and sitemap');
  report.internalLinkCount=internal.size;
 }catch(e){failures('test run',e.stack)}finally{
  if(browser)await browser.close();if(!live)server.close();
  fs.writeFileSync(path.join(output,live?'live-report.json':'local-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({mode:report.mode,pages:report.pages,viewports:report.viewports,failures:report.failures,downloads:report.downloads.length,internalLinks:report.internalLinkCount,external:report.external,checks:report.checks},null,2));
  process.exitCode=report.failures.length?1:0;
 }
})();
