import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { collegeRegistrations, participants, expoProjects, expoTeamMembers } from '@/db/schema';
import { type RegistrationInput } from './validation';
import { storeAbstractPdf, deleteAbstractPdf, storePaymentScreenshot, deletePaymentScreenshot } from './storage';
import { sendRegistrationConfirmationEmail } from './email';
import { createConfirmationToken } from './confirmation-token';
export async function createRegistration(input:RegistrationInput) {
 const db=await getDb(); let code='';
 for(let i=0;i<100;i++){code=`NEXUS26-${randomInt(0,10000).toString().padStart(4,'0')}`;if(!(await db.select().from(collegeRegistrations).where(eq(collegeRegistrations.registrationCode,code))).length) break;code='';}
 if(!code) throw new Error('Registration code space exhausted');
 const storedAbstract = input.expo?.abstract ? await storeAbstractPdf({registrationCode:code,fileName:input.expo.abstract.name,bytes:Buffer.from(await input.expo.abstract.arrayBuffer())}):undefined;
 let storedScreenshot:{provider:string|null;key:string|null;fileName:string|null;size:number|null;sha256:string|null}|undefined;
 if (input.payment.paymentScreenshot) {
  try {
   storedScreenshot = await storePaymentScreenshot({
    registrationCode: code,
    fileName: input.payment.paymentScreenshot.name,
    mimeType: input.payment.paymentScreenshot.type,
    bytes: Buffer.from(await input.payment.paymentScreenshot.arrayBuffer()),
   });
  } catch (err) {
   if (storedAbstract) await deleteAbstractPdf(storedAbstract).catch(console.error);
   throw err;
  }
 }
 let registration;
 try { registration=await db.transaction(async tx=>{
  const { students, expo, payment, ...rest } = input;
  const [r]=await tx.insert(collegeRegistrations).values({
   ...rest,
   registrationCode:code,
   arrivalPlan:input.arrivalPlan||null,
   paymentCategory: payment.category,
   paymentAmount: payment.amount,
   hasCsiMembership: payment.hasCsiMembership,
   csiMemberId: payment.csiMemberId || null,
   csiMemberName: payment.csiMemberName || null,
   utrNumber: payment.utrNumber,
   paymentStorageProvider: storedScreenshot?.provider || null,
   paymentStorageKey: storedScreenshot?.key || null,
   paymentFileName: storedScreenshot?.fileName || null,
   paymentMimeType: input.payment.paymentScreenshot?.type || null,
   paymentSizeBytes: storedScreenshot?.size || null,
   paymentSha256: storedScreenshot?.sha256 || null,
   paymentStatus: 'Submitted for Verification',
  }).returning();
  const rows=await tx.insert(participants).values(students.map((s,i)=>({...s,registrationId:r.id,participantIndex:i,participantType:'student',isShowcasePresenter:[s.fullName.toLowerCase(),s.email.toLowerCase()].includes(input.chapterShowcasePresenter.toLowerCase()),requiresAccommodation:input.accommodationParticipantNames.some(n=>n.toLowerCase()===s.fullName.toLowerCase())}))).returning();
  if(input.facultyAccompanying) await tx.insert(participants).values({registrationId:r.id,participantIndex:rows.length,fullName:input.facultyCoordinatorName,department:'',year:0,contactNumber:input.facultyCoordinatorContact,email:input.facultyCoordinatorEmail,participantType:'faculty_coordinator',requiresAccommodation:input.accommodationParticipantNames.some(n=>n.toLowerCase()===input.facultyCoordinatorName.toLowerCase())});
  if(expo&&storedAbstract){const [p]=await tx.insert(expoProjects).values({registrationId:r.id,teamName:expo.teamName,projectTitle:expo.projectTitle,category:expo.category,description:expo.description,abstractStorageProvider:storedAbstract.provider,abstractStorageKey:storedAbstract.key,abstractFileName:storedAbstract.fileName,abstractMimeType:'application/pdf',abstractSizeBytes:storedAbstract.size,abstractSha256:storedAbstract.sha256}).returning();await tx.insert(expoTeamMembers).values(expo.teamMembers.map(i=>({projectId:p.id,participantId:rows[Number(i)].id})));}
  return r;
 }); } catch(e) {
  if(storedAbstract) await deleteAbstractPdf(storedAbstract).catch(console.error);
  if(storedScreenshot) await deletePaymentScreenshot({provider:storedScreenshot!.provider!,key:storedScreenshot!.key!}).catch(console.error);
  throw e;
 }
 const confirmationToken=createConfirmationToken(code);
 let delivery: {status:string};try {delivery=await sendRegistrationConfirmationEmail({...registration,confirmationToken,teamName:input.expo?.teamName});if(delivery.status==='sent') await db.update(collegeRegistrations).set({confirmationEmailSentAt:new Date()}).where(eq(collegeRegistrations.id,registration.id));}catch(e){console.error('Confirmation email failed',e);delivery={status:'failed'};}
 return {registrationCode:code,message:'Registration submitted successfully',whatsappLink:process.env.WHATSAPP_COMMUNITY_LINK||null,summary:registration,participants:input.students,expo:input.expo?{teamName:input.expo.teamName,projectTitle:input.expo.projectTitle,category:input.expo.category,description:input.expo.description}:null,confirmationToken,emailDelivery:delivery};
}
export async function registrationDetail(id:string){const db=await getDb();const [registration]=await db.select().from(collegeRegistrations).where(eq(collegeRegistrations.id,id));if(!registration)return null;const people=await db.select().from(participants).where(eq(participants.registrationId,id));const [project]=await db.select().from(expoProjects).where(eq(expoProjects.registrationId,id));const team=project?await db.select().from(expoTeamMembers).where(eq(expoTeamMembers.projectId,project.id)):[];return {registration,participants:people,expoProject:project||null,teamMembers:team};}
