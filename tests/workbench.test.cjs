const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','企业档案工作台.html'),'utf8');
const errors=[];
function makeApp(saved){const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(html,{url:'http://trade-ui.test/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};if(saved)w.localStorage.setItem('foreigntrade.company-profile.v1',saved);}});return dom;}
test('workspaces, profile editing, independent conversations and session restore',()=>{
const dom=makeApp();const w=dom.window,d=w.document;
function click(selector){const el=d.querySelector(selector);assert(el,selector);el.click();return el;}
function send(text){const el=d.querySelector('#conversation-input');el.value=text;el.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(d.querySelector('[data-chat-action="send"]').disabled,false);click('[data-chat-action="send"]');}
function state(){return JSON.parse(w.localStorage.getItem('foreigntrade.company-profile.v1'));}
assert.equal(d.querySelectorAll('#main-nav button').length,3);
assert.equal(d.querySelectorAll('.context-group[data-context-group]').length,4);
click('[data-chat-action="toggle-context"]');assert(d.querySelector('.chat-shell.context-collapsed'));assert.equal(d.querySelector('[data-chat-action="toggle-context"]').getAttribute('aria-expanded'),'false');
click('[data-chat-action="toggle-context"]');assert(!d.querySelector('.chat-shell.context-collapsed'));
send('公司叫示例清洁用品公司，我们是做商用清洁用品的工厂，支持 OEM，想开发澳大利亚的经销商。');
assert.equal(state().draft.name,'示例清洁用品公司');assert(d.querySelector('.context-company').textContent.includes('示例清洁用品公司'));
click('.workspace-tabs button');assert(d.querySelector('#conversation-editor').open);click('[data-chat-action="close-editor"]');assert.equal(d.querySelector('#conversation-editor').open,false);
click('#main-nav [data-view="leads"]');assert.equal(state().chat.view,'leads');assert(d.querySelector('[aria-label="当前任务状态"]'));
send('这次想寻找澳大利亚的清洁用品经销商，排除清洁服务商。');
const leadsMessages=state().chat.threads.leads.length;assert(leadsMessages>=2);
click('#main-nav [data-view="social"]');assert.equal(state().chat.threads.social.length,0);assert.equal(state().chat.threads.leads.length,leadsMessages);
send('想为 LinkedIn 生成一篇采购指南，内容面向经销商采购人员，使用英语。');
assert(state().chat.threads.social.length>=2);assert.equal(state().chat.threads.leads.length,leadsMessages);
click('[data-chat-action="show-state"]');assert(d.querySelector('#context-dialog').open);click('[data-chat-action="close-state"]');assert.equal(d.querySelector('#context-dialog').open,false);
click('.workspace-tabs button');assert(d.querySelector('#conversation-editor').open);assert(d.querySelector('#conversation-editor').textContent.includes('编辑本次任务'));click('[data-chat-action="close-editor"]');
const saved=w.localStorage.getItem('foreigntrade.company-profile.v1');const restored=makeApp(saved);assert.equal(restored.window.document.querySelector('#main-nav button.active').dataset.view,'social');assert(restored.window.document.querySelectorAll('.message').length>=2);
assert.deepEqual(errors,[]);

dom.window.close();restored.window.close();
});

test('sidebar modules and neutral background',()=>{
 const dom=makeApp();const d=dom.window.document;
 assert.equal(d.querySelectorAll('.module-sidebar #main-nav button').length,3);
 assert.equal(d.querySelector('h1#breadcrumb').textContent,'企业档案');
 assert.equal(d.querySelector('#module-description').textContent,'整理企业信息，建立共用档案');
 assert(!html.includes('radial-gradient'));
 dom.window.close();
});
