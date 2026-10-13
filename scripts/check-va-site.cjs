const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),live=process.argv.includes('--live');
const out=path.join(root,'qa-va');fs.mkdirSync(out,{recursive:true});
const pages=['virtual-assistant/index.html','virtual-assistant/work.html','virtual-assistant/resume.html'];
const report={mode:live?'live':'preview',viewports:[],accessibility:[],downloads:[],links:[],checks:[],failures:[]};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.csv':'text/csv','.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const server=http.createServer((req,res)=>{
 try{
  let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url.endsWith('/'))url+='index.html';
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 }catch{res.writeHead(500);res.end()}
});
function fail(label,message){report.failures.push({label,message})}
(async()=>{
 let browser;
 try{
  if(!live)await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=live?'https://ericcruzdigital.github.io/':'http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>fail('javascript',e.message));
  const links=new Set(),downloads=new Set();
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:900});
   for(const file of pages){
    const url=base+file.replace('/index.html','/');
    const response=await page.goto(url,{waitUntil:'networkidle'});
    assert.equal(response.status(),200,url);
    if(live)assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n'),'Published HTML mismatch');
    const data=await page.evaluate(()=>({
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     title:document.title,h1:document.querySelectorAll('h1').length,
     levels:[...document.querySelectorAll('h1,h2,h3')].map(x=>Number(x.tagName[1])),
     canonical:document.querySelector('link[rel=canonical]')?.href,
     desc:document.querySelector('meta[name=description]')?.content,
     og:document.querySelector('meta[property="og:url"]')?.content,
     schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),
     images:[...document.images].map(x=>({ok:x.complete&&x.naturalWidth>0,alt:x.alt,width:x.width,natural:x.naturalWidth})),
     links:[...document.querySelectorAll('a[href]')].map(x=>({href:x.href,text:x.innerText||x.getAttribute('aria-label'),download:x.hasAttribute('download')})),
     text:document.body.innerText
    }));
    assert.equal(data.overflow,false,file+' overflow at '+width);assert.equal(data.h1,1);assert.ok(data.desc);assert.ok(data.schema.length);
    const canonical='https://ericcruzdigital.github.io/'+file.replace('/index.html','/');
    assert.equal(data.canonical,canonical);assert.equal(data.og,canonical);
    for(let i=1;i<data.levels.length;i++)assert.ok(data.levels[i]<=data.levels[i-1]+1,'Heading hierarchy');
    for(const im of data.images){assert.ok(im.ok&&im.alt);assert.ok(im.width<=im.natural,'Portrait must not be enlarged')}
    assert.ok(!/JDS1|Electrical Engineer|salary expectations|\$6|\$10|Salesforce|HubSpot|Zapier|lorem ipsum|TBD/i.test(data.text),'Content scope');
    for(const l of data.links){assert.ok(l.text,'Accessible link name');if(l.href.startsWith(base)){links.add(l.href);if(l.download)downloads.add(l.href)}}
    await page.screenshot({path:path.join(out,(live?'live-':'')+path.basename(file,'.html')+'-viewport-'+width+'.png')});
    if(width===1440||width===390){
     await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
     const results=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
     report.accessibility.push({file,width,violations:results.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>n.target)}))});
     for(const v of results.violations)fail(file+'@'+width,v.id+': '+JSON.stringify(v.nodes.map(n=>n.target)));
     await page.screenshot({path:path.join(out,(live?'live-':'')+path.basename(file,'.html')+'-'+width+'.png'),fullPage:true});
    }
   }
   report.viewports.push(width);
  }
  for(const link of links){
   const u=new URL(link),fragment=decodeURIComponent(u.hash.slice(1));u.hash='';
   const r=await context.request.get(u.href);assert.equal(r.status(),200,link);
   if(fragment)assert.ok((await r.text()).includes('id="'+fragment+'"'),link);
   report.links.push({url:link,status:r.status()});
  }
  for(const url of downloads){
   const r=await context.request.get(url),buffer=await r.body();
   const relative=new URL(url).pathname.slice(1);
   assert.ok(buffer.equals(fs.readFileSync(path.join(root,relative))),url+' byte mismatch');
   if(url.endsWith('.pdf'))assert.equal(buffer.subarray(0,4).toString(),'%PDF');
   if(url.endsWith('.docx'))assert.equal(buffer.subarray(0,2).toString(),'PK');
   report.downloads.push({url,bytes:buffer.length,exactMatch:true});
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'virtual-assistant/');
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').innerText(),'Skip to content');
  await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#main');
  report.checks.push('Keyboard skip navigation works');
  for(const ext of ['pdf','docx']){
   await page.goto(base+'virtual-assistant/resume.html');
   const anchor=page.locator('a[download][href$=".'+ext+'"]').first();
   const [download]=await Promise.all([page.waitForEvent('download'),anchor.click()]);
   assert.equal(await download.failure(),null);
   assert.equal(download.suggestedFilename(),'Eric_John_Cruz_Virtual_Assistant_Resume.'+ext);
  }
  report.checks.push('Actual PDF and Word download interactions');
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:844}});
  const np=await nojs.newPage();await np.goto(base+'virtual-assistant/');
  for(const a of await np.locator('header nav a').all())assert.ok(await a.isVisible());
  await nojs.close();report.checks.push('Navigation available at 320px without JavaScript');
  const contacts=await page.locator('a[href^="mailto:"]').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
  assert.ok(contacts.length);assert.ok(contacts.every(x=>x.startsWith('mailto:cruzericjohn@gmail.com')));
  assert.ok(await page.locator('a[href="https://www.linkedin.com/in/eric-john-cruz-ree/"]').count());
  report.checks.push('Public email and LinkedIn destinations match verified source');
  for(const file of ['index.html','resume.html','evidence.html','experience.html','styles.css','script.js','downloads/Eric_John_Cruz_Resume.docx']){
   const cp=require('child_process');
   const original=cp.execFileSync('git',['show','586f167cf6886b43a6ac7a0b1c7330c01466c218:'+file],{maxBuffer:5*1024*1024});
   assert.ok(original.equals(fs.readFileSync(path.join(root,file))),'Existing file changed: '+file);
  }
  for(const file of ['index.html','resume.html','evidence.html']){
   const r=await context.request.get('https://ericcruzdigital.github.io/'+file,{timeout:30000});
   assert.equal(r.status(),200,'Existing live '+file);
   assert.equal((await r.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n'),'Existing live page differs: '+file);
  }
  report.checks.push('Existing marketing homepage, experience, resume, evidence, styles, script and Word file preserved; main live pages match');
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  for(const file of pages)assert.ok(sitemap.includes('https://ericcruzdigital.github.io/'+file.replace('/index.html','/')));
  report.checks.push('VA pages included in sitemap');
  if(live){
   const r=await context.request.get(base+'virtual-assistant/styles.css?v=20261013');
   assert.equal(await r.text(),fs.readFileSync(path.join(root,'virtual-assistant/styles.css'),'utf8'));
   report.checks.push('Live stylesheet matches reviewed source');
  }
 }catch(e){fail('verification',e.stack)}
 finally{
  if(browser)await browser.close();if(!live)server.close();
  fs.writeFileSync(path.join(out,live?'live-report.json':'site-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));process.exitCode=report.failures.length?1:0;
 }
})();
