// Single-column, text-only Word résumé. Content shared with resume.html.
const fs = require('fs');
const path = require('path');
const dependencyRoot = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.resolve(path.dirname(process.execPath), '../node_modules');
function dependency(name) { try { return require(name); } catch { return require(require.resolve(name, {paths: [dependencyRoot]})); } }
const {Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, AlignmentType, LevelFormat} = dependency('docx');
const root = path.resolve(__dirname, '..');
const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'resume.json'), 'utf8'));
const run = (text, options={}) => new TextRun({text, ...options});
const link = (text, url) => new ExternalHyperlink({link: url, children:[run(text, {color:'17465B', underline:{}})]});
const p = (children, options={}) => new Paragraph({children: typeof children==='string'?[run(children)]:children, ...options});
const heading = text => p(text, {heading:HeadingLevel.HEADING_1, spacing:{before:115,after:45}, keepNext:true});
const bullet = children => p(children,{numbering:{reference:'resume-bullets',level:0},spacing:{after:30},keepLines:true});
const content = [
 p(r.name,{heading:HeadingLevel.TITLE,spacing:{after:35}}),
 p([run(r.title,{bold:true,size:25})],{spacing:{after:35}}),
 p(r.location,{spacing:{after:10}}),
 p([link(r.email,'mailto:'+r.email),run(' | '),link('ericcruzdigital.github.io',r.website)],{spacing:{after:10}}),
 p([link('linkedin.com/in/eric-john-cruz-ree',r.linkedin)],{spacing:{after:25}}),
 heading('Professional Summary'),p(r.summary),
 heading('Professional Experience'),
 p([run(r.role,{bold:true})],{keepNext:true,spacing:{after:10}}),
 p(r.employment,{keepNext:true,spacing:{after:45}}),
 ...r.bullets.map(t=>bullet(t)),
 p([run(r.support_role,{bold:true})],{keepNext:true,spacing:{before:55,after:10}}),
 p(r.support_employment,{keepNext:true,spacing:{after:30}}),p(r.support_text),
 heading('Selected Work'),
 ...r.work.map(w=>bullet([link(w.label,r.website+w.path),run(': '+w.text)])),
 heading('Skills & Tools'),
 ...r.tools.map(([label,text])=>p([run(label+': ',{bold:true}),run(text)],{spacing:{after:25}})),
 heading('Education & Credential'),p(r.education),p(r.credential)
];
const doc = new Document({
 creator:r.name,title:r.name+' | '+r.title,description:'Professional résumé',
 styles:{default:{document:{run:{font:'Calibri',size:22,color:'111111'},paragraph:{spacing:{after:30,line:245}}}},paragraphStyles:[
 {id:'Title',name:'Title',basedOn:'Normal',run:{font:'Calibri',size:36,bold:true,color:'000000'},paragraph:{keepNext:true}},
 {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',run:{font:'Calibri',size:22,bold:true,color:'000000'},paragraph:{keepNext:true}}
 ]},
 numbering:{config:[{reference:'resume-bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:190,hanging:190}}}}]}]},
 sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:650,bottom:650,left:760,right:760}}},children:content}]
});
Packer.toBuffer(doc).then(buffer=>{
 fs.writeFileSync(path.join(root,'downloads/Eric_John_Cruz_Resume.docx'),buffer);
 console.log('Built ATS-friendly Word résumé ('+buffer.length+' bytes).');
});
