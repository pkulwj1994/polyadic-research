import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import path from 'node:path';
import { projectRoot } from '../scripts/build.mjs';

const folder=path.join(projectRoot,'others/CDLM_Post_1_HTML');
const script=readFileSync(path.join(folder,'assets/diagrams.js'),'utf8');

for(const language of ['en','zh-CN']){
  test(`generation diagram plays, finishes, and resets in ${language}`,()=>{
    const chinese=language==='zh-CN';
    const html=readFileSync(path.join(folder,chinese?'zh.html':'index.html'),'utf8');
    const playLabel={textContent:''},playIcon={innerHTML:''},count={textContent:''},announcement={textContent:''};
    const playEvents={},resetEvents={};
    const play={
      querySelector:selector=>selector==='span'?playLabel:playIcon,
      addEventListener:(event,callback)=>{playEvents[event]=callback;},
      setAttribute:()=>{}
    };
    const reset={disabled:true,addEventListener:(event,callback)=>{resetEvents[event]=callback;}};
    const lanes=['ar','whole','block'].map(kind=>{
      const staticStatus=html.match(new RegExp('data-lane="'+kind+'"[\\s\\S]*?data-static-status="([^"]+)"'))[1];
      const status={dataset:{staticStatus},textContent:staticStatus};
      const tokens=Array.from({length:6},(_,index)=>({
        dataset:{position:String(index+1),state:'done'},
        style:{setProperty:()=>{}},
        querySelector:()=>({innerHTML:''})
      }));
      return {dataset:{lane:kind},status,tokens,querySelector:()=>status,querySelectorAll:()=>tokens};
    });
    const controls={hidden:true};
    const elements={'[data-demo-play]':play,'[data-demo-reset]':reset,'[data-demo-count]':count,'[data-demo-announcement]':announcement,'.diagram-controls':controls};
    const root={dataset:{},querySelector:selector=>elements[selector],querySelectorAll:()=>lanes};
    const timers=new Map();
    let nextTimer=0;
    const window={
      matchMedia:()=>({matches:false,addEventListener:()=>{}}),
      setTimeout:callback=>{const id=++nextTimer;timers.set(id,callback);return id;},
      clearTimeout:id=>timers.delete(id),
      addEventListener:()=>{}
    };
    const document={documentElement:{lang:language},readyState:'complete',querySelectorAll:()=>[root]};
    runInNewContext(script,{window,document});
    assert.equal(controls.hidden,false);
    playEvents.click();
    assert.equal(playLabel.textContent,chinese?'暂停':'Pause');
    assert.equal(count.textContent,chinese?'第 0 / 6 步':'Step 0 / 6');
    for(let step=1;step<=6;step++){
      const [id,callback]=timers.entries().next().value;
      timers.delete(id);callback();
    }
    assert.equal(playLabel.textContent,chinese?'重新播放':'Replay');
    assert.equal(count.textContent,chinese?'第 6 / 6 步':'Step 6 / 6');
    assert.equal(timers.size,0);
    assert.ok(announcement.textContent.includes(chinese?'演示结束':'Illustration complete'));
    for(const lane of lanes)assert.ok(lane.tokens.every(token=>token.dataset.state==='done'));
    resetEvents.click();
    assert.equal(playLabel.textContent,chinese?'播放步骤':'Play steps');
    assert.equal(count.textContent,'');
    assert.equal(reset.disabled,true);
    for(const lane of lanes)assert.equal(lane.status.textContent,lane.status.dataset.staticStatus);
  });
}
