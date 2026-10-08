// Wait for the homepage and Word file to match this checkout before live checks.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['index.html','downloads/Eric_John_Cruz_Resume.docx'];
(async()=>{
 for(let attempt=1;attempt<=40;attempt++){
  let ready=true;
  for(const file of files){
   try{
    const r=await fetch('https://ericcruzdigital.github.io/'+file+'?verify='+process.env.GITHUB_SHA,{cache:'no-store'});
    const bytes=Buffer.from(await r.arrayBuffer());
    if(!r.ok||digest(bytes)!==digest(fs.readFileSync(path.join(root,file))))ready=false;
   }catch{ready=false}
  }
  if(ready){console.log('Live homepage and Word resume match the committed files.');return}
  console.log('Waiting for Pages deployment, attempt '+attempt);
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 throw new Error('Pages did not serve the committed homepage and Word file within the verification window.');
})().catch(error=>{console.error(error);process.exitCode=1});
