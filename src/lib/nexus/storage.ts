import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
const abstractRoot=()=>path.resolve('.data/abstracts');
const paymentRoot=()=>path.resolve('.data/payments');
function s3() { return new S3Client({region:process.env.S3_REGION||'auto',endpoint:process.env.S3_ENDPOINT||undefined,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID!,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY!}}); }
function configured(){return !!(process.env.S3_BUCKET&&process.env.S3_ACCESS_KEY_ID&&process.env.S3_SECRET_ACCESS_KEY);}
function localPath(key:string,root:()=>string){const p=path.resolve(root(),key);if(!p.startsWith(root()+path.sep)) throw new Error('Invalid storage key');return p;}
export async function storeAbstractPdf({registrationCode,fileName,bytes}:{registrationCode:string;fileName:string;bytes:Buffer}) {
 const safe=path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120)||'abstract.pdf'; const key=`${registrationCode}/${randomUUID()}-${safe}`; const provider=configured()?'s3':'local';
 if(provider==='s3') await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:'application/pdf'})); else {const p=localPath(key,abstractRoot);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,bytes,{mode:0o600});}
 return {provider,key,fileName:safe,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
export async function readAbstractPdf({provider,key}:{provider:string;key:string}):Promise<Buffer> {if(provider==='local') return readFile(localPath(key,abstractRoot));if(provider!=='s3'||!configured()) throw new Error('Storage unavailable');const result=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));return Buffer.from(await result.Body!.transformToByteArray());}
export async function deleteAbstractPdf({provider,key}:{provider:string;key:string}) {if(provider==='local') await unlink(localPath(key,abstractRoot));else if(provider==='s3'&&configured()) await s3().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));}
export async function storePaymentScreenshot({registrationCode,fileName,mimeType,bytes}:{registrationCode:string;fileName:string;mimeType:string;bytes:Buffer}) {
 const safe=path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120)||'proof.png'; const key=`${registrationCode}/${randomUUID()}-${safe}`; const provider=configured()?'s3':'local';
 if(provider==='s3') await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:bytes,ContentType:mimeType})); else {const p=localPath(key,paymentRoot);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,bytes,{mode:0o600});}
 return {provider,key,fileName:safe,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
export async function readPaymentScreenshot({provider,key,mimeType}:{provider:string;key:string;mimeType:string}):Promise<Buffer> {if(provider==='local') return readFile(localPath(key,paymentRoot));if(provider!=='s3'||!configured()) throw new Error('Storage unavailable');const result=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));return Buffer.from(await result.Body!.transformToByteArray());}
export async function deletePaymentScreenshot({provider,key}:{provider:string;key:string}) {if(provider==='local') await unlink(localPath(key,paymentRoot));else if(provider==='s3'&&configured()) await s3().send(new DeleteObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));}
