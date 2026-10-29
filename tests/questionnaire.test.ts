import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import type {QuestionnaireStage,QuestionnaireContext} from '../src/nativeQuestionnaire.ts';

// Exercise the actual renderer without loading browser CSS or SQLite in Node.
const source=readFileSync(new URL('../src/nativeQuestionnaire.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported:Record<string,unknown>={};
runInNewContext(compiled,{exports:exported,yukiFace:'<svg aria-label="Yuki"></svg>',setTimeout,clearTimeout});
const render=exported.renderNativeQuestionnaireStage as (stage:QuestionnaireStage,ctx:QuestionnaireContext)=>string|null;
const ctx:QuestionnaireContext={asset:name=>'/assets/'+name,icon:key=>`<svg data-icon="${key}"></svg>`};

test('reconstructs supported alternate stages and delegates existing or unavailable layouts',()=>{
 for(const stage of ['WELCOME','YUKI_INTRO','GOAL','PAIN_POINTS','SOCIAL_PROOF','SOLUTION','PERM_LOCATION','PERM_NOTIFICATIONS','PERM_MOTION','PROCESSING','VALUE_DELIVERY'] as QuestionnaireStage[]){
  assert.match(render(stage,ctx)!,new RegExp(`data-questionnaire-stage="${stage}"`));
 }
 for(const stage of ['TINDER_CARDS','SKILL_LEVEL','APP_DEMO','SIGN_UP','DONE','PAYWALL'] as QuestionnaireStage[])assert.equal(render(stage,ctx),null);
 assert.ok(render('PAYWALL',{...ctx,subscription:()=>'<div>Original plan selectors</div>'})!.includes('Original plan selectors'));
});

test('uses native goal glyphs and renders pain choices with leading checkboxes',()=>{
 const goal=render('GOAL',{...ctx,selected:['friends']})!;
 assert.ok(goal.includes('data-icon="groups"'));
 assert.ok(goal.includes('data-icon="trophy"'));
 assert.ok(goal.includes('data-questionnaire-choice="friends" aria-pressed="true"'));
 assert.equal(goal.includes('data-questionnaire-next'),false);
 const pain=render('PAIN_POINTS',{...ctx,selected:['lost','difficulty']})!;
 assert.equal((pain.match(/nq-option-checkbox/g)||[]).length,6);
 assert.equal((pain.match(/aria-pressed="true"/g)||[]).length,2);
 assert.equal(pain.includes('data-icon='),false);
 assert.ok(pain.includes('data-questionnaire-next'));
 assert.equal(pain.includes('data-questionnaire-next disabled'),false);
 assert.ok(render('PAIN_POINTS',ctx)!.includes('data-questionnaire-next disabled'));
});

test('escapes recovered choice copy and bounds processing messages',()=>{
 assert.ok(render('GOAL',ctx)!.includes('Navigate resorts I&#39;ve never been to'));
 assert.ok(render('PROCESSING',{...ctx,processingIndex:99})!.includes('Building your mountain profile...'));
 assert.ok(render('PROCESSING',{...ctx,processingIndex:-5})!.includes('Analyzing your preferences...'));
});
