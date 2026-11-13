import { ARRIVAL_PLANS, EXPO_PROJECT_CATEGORIES, getMaxAbstractBytes, PAYMENT_CATEGORIES, MAX_PAYMENT_PROOF_BYTES } from './constants';
export class ValidationError extends Error { constructor(public issues: string[]) { super(issues.join('; ')); } }
export type Student = { fullName:string; department:string; year:number; contactNumber:string; email:string };
export type PaymentInput = { hasCsiMembership:boolean; csiMemberId?:string; csiMemberName?:string; utrNumber:string; category:string; amount:number; paymentScreenshot?:File };
export type RegistrationInput = { collegeName:string; csiChapterName:string; csiChapterId?:string; city:string; facultyCoordinatorName:string; facultyCoordinatorEmail:string; facultyCoordinatorContact:string; facultyAccompanying:boolean; totalRepresentatives:number; students:Student[]; chapterShowcasePresenter:string; participatingInExpo:boolean; expo?:{teamName:string;projectTitle:string;category:string;description:string;teamMembers:(string|number)[];abstract?:File}; accommodationRequired:boolean; arrivalPlan?:string; maleAccommodationCount:number; femaleAccommodationCount:number; accommodationParticipantNames:string[]; declarationAccepted:boolean; payment:PaymentInput };
const str = (v:unknown) => typeof v === 'string' ? v.trim() : '';
const bool = (v:unknown) => v === true || v === 'true';
const list = (v:unknown): unknown[] => Array.isArray(v) ? v : [];
const email = (s:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export async function parseRegistrationRequest(req:Request):Promise<RegistrationInput> {
  let raw:Record<string, unknown>;
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await req.formData();
    const payload = form.get('payload');
    if (typeof payload === 'string') raw = JSON.parse(payload);
    else { raw = Object.fromEntries(form.entries()); for (const k of ['students','expo','accommodationParticipantNames','payment']) if (typeof raw[k] === 'string') raw[k] = JSON.parse(raw[k] as string); }
    const file = form.get('abstract'); if (file instanceof File) raw.expo = {...(raw.expo as object || {}), abstract:file};
    const screenshot = form.get('paymentScreenshot'); if (screenshot instanceof File) raw.payment = {...(raw.payment as object || {}), paymentScreenshot:screenshot};
  } else raw = await req.json();
  return validateRegistration(raw);
}
export async function validateRegistration(raw:Record<string, unknown>):Promise<RegistrationInput> {
  const errors:string[]=[];
  const students = list(raw.students).map(v=>{const s = v as Record<string,unknown>; return {fullName:str(s.fullName),department:str(s.department),year:Number(s.year),contactNumber:str(s.contactNumber),email:str(s.email)};});
  const p = (raw.payment || {}) as Record<string,unknown>;
  const hasCsi = bool(p.hasCsiMembership);
  const category = hasCsi ? 'CSI Member' : 'General';
  const amount = hasCsi ? 200 : 300;
  const utr = str(p.utrNumber);
  const screenshot = p.paymentScreenshot instanceof File ? p.paymentScreenshot : undefined;
  if (!utr) errors.push('UTR number is required');
  if (!PAYMENT_CATEGORIES.includes(category as never)) errors.push('Invalid payment category');
  if (!screenshot) errors.push('Payment proof (screenshot) is required');
  else if (screenshot.size > MAX_PAYMENT_PROOF_BYTES) errors.push('Payment screenshot must be under 5 MB');
  const payment:PaymentInput = { hasCsiMembership:hasCsi, csiMemberId:hasCsi?str(p.csiMemberId)||undefined:undefined, csiMemberName:hasCsi?str(p.csiMemberName)||undefined:undefined, utrNumber:utr, category, amount, paymentScreenshot:screenshot };
  const data:RegistrationInput = {collegeName:str(raw.collegeName), csiChapterName:str(raw.csiChapterName), csiChapterId:str(raw.csiChapterId)||undefined,city:str(raw.city),facultyCoordinatorName:str(raw.facultyCoordinatorName),facultyCoordinatorEmail:str(raw.facultyCoordinatorEmail),facultyCoordinatorContact:str(raw.facultyCoordinatorContact),facultyAccompanying:bool(raw.facultyAccompanying),totalRepresentatives:Number(raw.totalRepresentatives),students,chapterShowcasePresenter:str(raw.chapterShowcasePresenter),participatingInExpo:bool(raw.participatingInExpo),accommodationRequired:bool(raw.accommodationRequired),arrivalPlan:str(raw.arrivalPlan)||undefined,maleAccommodationCount:Number(raw.maleAccommodationCount || 0),femaleAccommodationCount:Number(raw.femaleAccommodationCount || 0),accommodationParticipantNames:list(raw.accommodationParticipantNames).map(str),declarationAccepted:bool(raw.declarationAccepted), payment};
  for(const k of ['collegeName','csiChapterName','city','facultyCoordinatorName','facultyCoordinatorContact'] as const) if(!data[k]) errors.push(k + ' is required');
  if(!email(data.facultyCoordinatorEmail)) errors.push('Valid facultyCoordinatorEmail is required');
  if(!Number.isInteger(data.totalRepresentatives)||data.totalRepresentatives<1||data.totalRepresentatives>5||students.length !== data.totalRepresentatives - Number(data.facultyAccompanying)) errors.push('Delegation must contain 1-5 representatives with the correct student count');
  if(students.some(s=>!s.fullName||!s.department||!s.contactNumber||!email(s.email)||!Number.isInteger(s.year)||s.year<1||s.year>4)) errors.push('Each student needs valid name, department, year, contact and email');
  if(new Set(students.map(s=>s.email.toLowerCase())).size!==students.length) errors.push('Student emails must be unique');
  const match = (v:string,s:Student) => [s.fullName.toLowerCase(),s.email.toLowerCase()].includes(v.trim().toLowerCase());
  if(!students.some(s=>match(data.chapterShowcasePresenter,s))) errors.push('Showcase presenter must be a registered student');
  if(data.participatingInExpo) {
   const x=(raw.expo || {}) as Record<string,unknown>; const members=list(x.teamMembers) as (string|number)[]; const indexes=members.map(m=>typeof m==='number'?m:students.findIndex(s=>match(String(m),s)));
   const encoded=x.abstract as {fileName?:unknown;mimeType?:unknown;base64?:unknown}|undefined; const file=x.abstract instanceof File?x.abstract:(encoded && typeof encoded.base64==='string' && typeof encoded.fileName==='string' && typeof encoded.mimeType==='string' ? new File([Buffer.from(encoded.base64,'base64')],encoded.fileName,{type:encoded.mimeType}) : undefined);
   if(!str(x.teamName)||str(x.teamName).length>160) errors.push('Expo team name is required and must be at most 160 characters');
   if(!str(x.projectTitle)||!EXPO_PROJECT_CATEGORIES.includes(str(x.category) as never)) errors.push('Expo title and category are required');
   if(indexes.length<2||indexes.length>4||new Set(indexes).size!==indexes.length||indexes.some(i=>!Number.isInteger(i)||i<0||i>=students.length)) errors.push('Expo team must contain 2-4 distinct registered students');
   if(!file || !file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf' || file.size===0 || file.size>getMaxAbstractBytes() || Buffer.from(await file.slice(0,5).arrayBuffer()).toString()!=='%PDF-') errors.push('A valid PDF abstract within the size limit is required');
   data.expo={teamName:str(x.teamName),projectTitle:str(x.projectTitle),category:str(x.category),description:str(x.description),teamMembers:indexes,abstract:file};
  }
  if(data.accommodationRequired) {
   const count=data.maleAccommodationCount+data.femaleAccommodationCount; const names=[...students.map(s=>s.fullName),...(data.facultyAccompanying?[data.facultyCoordinatorName]:[])].map(x=>x.toLowerCase());
   if(!ARRIVAL_PLANS.includes(data.arrivalPlan as never)||![data.maleAccommodationCount,data.femaleAccommodationCount].every(x=>Number.isInteger(x)&&x>=0)||count<1||count>data.totalRepresentatives||data.accommodationParticipantNames.length!==count||new Set(data.accommodationParticipantNames.map(x=>x.toLowerCase())).size!==count||data.accommodationParticipantNames.some(x=>!names.includes(x.toLowerCase()))) errors.push('Invalid accommodation details');
  } else {data.arrivalPlan=undefined;data.maleAccommodationCount=0;data.femaleAccommodationCount=0;data.accommodationParticipantNames=[];}
  if(!data.declarationAccepted) errors.push('Declaration must be accepted');
  if(errors.length) throw new ValidationError(errors); return data;
}
