import initSqlJs, {type Database} from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type {Run,Resort,Point} from './domain';
export const schema=`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,started INTEGER NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS maps(slug TEXT PRIMARY KEY,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkpoint(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);`;
export let db: Database;
let storage:IDBDatabase;
export async function openDB(){
 const SQL=await initSqlJs({locateFile:()=>wasmUrl});
 storage=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('snowrun-local',1);r.onupgradeneeded=()=>r.result.createObjectStore('sqlite');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Local storage is unavailable. Enable site storage and reload.'));});
 const bytes=await new Promise<Uint8Array|undefined>((resolve,reject)=>{const r=storage.transaction('sqlite').objectStore('sqlite').get('database');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 db=bytes?new SQL.Database(bytes):new SQL.Database();db.run(schema);await persist();
}
export async function persist(){
 const bytes=db.export();
 await new Promise<void>((resolve,reject)=>{const tx=storage.transaction('sqlite','readwrite');tx.objectStore('sqlite').put(bytes,'database');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('Could not save to this device. Export your database before closing.'));tx.onabort=()=>reject(Error('Local storage is full or unavailable. Export a backup.'));});
}
export function setting(key:string,fallback=''){const result=db.exec('SELECT value FROM settings WHERE key=$key',{$key:key});return result[0]?.values[0]?.[0] as string??fallback;}
export async function setSetting(key:string,value:string){db.run('INSERT OR REPLACE INTO settings VALUES(?,?)',[key,value]);await persist();}
export function runs():Run[]{return (db.exec('SELECT payload FROM runs ORDER BY started DESC')[0]?.values??[]).map(row=>JSON.parse(String(row[0])) as Run);}
export async function saveRun(run:Run){db.run('BEGIN');try{db.run('INSERT OR REPLACE INTO runs VALUES(?,?,?)',[run.id,run.started,JSON.stringify(run)]);db.run('DELETE FROM checkpoint');db.run('COMMIT');}catch(e){db.run('ROLLBACK');throw e;}await persist();}
export async function deleteRun(id:string){db.run('DELETE FROM runs WHERE id=?',[id]);await persist();}
export async function saveMap(resort:Resort){db.run('INSERT OR REPLACE INTO maps VALUES(?,?)',[resort.slug,JSON.stringify(resort)]);await persist();}
export function savedMaps():Resort[]{return (db.exec('SELECT payload FROM maps')[0]?.values??[]).map(row=>JSON.parse(String(row[0])));}
export async function checkpoint(data:{points:Point[];started:number;duration:number;resort:string}|null){if(data)db.run('INSERT OR REPLACE INTO checkpoint VALUES(1,?)',[JSON.stringify(data)]);else db.run('DELETE FROM checkpoint');await persist();}
export function recover():{points:Point[];started:number;duration:number;resort:string}|undefined {const row=db.exec('SELECT payload FROM checkpoint')[0]?.values[0];return row?JSON.parse(String(row[0])):undefined;}
