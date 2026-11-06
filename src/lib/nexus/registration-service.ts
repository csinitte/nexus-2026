import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { collegeRegistrations, participants, expoProjects, expoTeamMembers } from '@/db/schema';
import { type RegistrationInput } from './validation';
import { storeAbstractPdf, deleteAbstractPdf } from './storage';
import { sendRegistrationConfirmationEmail } from './email';
import { createConfirmationToken } from './confirmation-token';
export async function createRegistration(input:RegistrationInput) {
 const db=await getDb(); let code='';
 for(let i=0;i<100;i++){code=`NEXUS26-${randomInt(0,10000).toString().padStart(4,'0')}`;if(!(await db.select().from(collegeRegistrations).where(eq(collegeRegistrations.registrationCode,code))).length) break;code='';}
 if(!code) throw new Error('Registration code space exhausted');
 const stored=input.expo?.abstract ? await storeAbstractPdf({registrationCode:code,fileName:input.expo.abstract.name,bytes:Buffer.from(await input.expo.abstract.arrayBuffer())}):undefined;
 let registration;
 try { registration=await db.transaction(async tx=>{
  const [r]=await tx.insert(collegeRegistrations).values({...input,registrationCode:code,arrivalPlan:input.arrivalPlan||null}).returning();
  const rows=await tx.insert(participants).values(input.students.map((s,i)=>({...s,registrationId:r.id,participantIndex:i,participantType:'student',isShowcasePresenter:[s.fullName.toLowerCase(),s.email.toLowerCase()].includes(input.chapterShowcasePresenter.toLowerCase()),requiresAccommodation:input.accommodationParticipantNames.some(n=>n.toLowerCase()===s.fullName.toLowerCase())}))).returning();
  if(input.facultyAccompanying) await tx.insert(participants).values({registrationId:r.id,participantIndex:rows.length,fullName:input.facultyCoordinatorName,department:'',year:0,contactNumber:input.facultyCoordinatorContact,email:input.facultyCoordinatorEmail,participantType:'faculty_coordinator',requiresAccommodation:input.accommodationParticipantNames.some(n=>n.toLowerCase()===input.facultyCoordinatorName.toLowerCase())});
  if(input.expo&&stored){const [p]=await tx.insert(expoProjects).values({registrationId:r.id,teamName:input.expo.teamName,projectTitle:input.expo.projectTitle,category:input.expo.category,description:input.expo.description,abstractStorageProvider:stored.provider,abstractStorageKey:stored.key,abstractFileName:stored.fileName,abstractMimeType:'application/pdf',abstractSizeBytes:stored.size,abstractSha256:stored.sha256}).returning();await tx.insert(expoTeamMembers).values(input.expo.teamMembers.map(i=>({projectId:p.id,participantId:rows[Number(i)].id})));}
  return r;
 }); } catch(e) {if(stored) await deleteAbstractPdf(stored).catch(console.error);throw e;}
 const confirmationToken=createConfirmationToken(code);
 let delivery: {status:string};try {delivery=await sendRegistrationConfirmationEmail({...registration,confirmationToken,teamName:input.expo?.teamName});if(delivery.status==='sent') await db.update(collegeRegistrations).set({confirmationEmailSentAt:new Date()}).where(eq(collegeRegistrations.id,registration.id));}catch(e){console.error('Confirmation email failed',e);delivery={status:'failed'};}
 return {registrationCode:code,message:'Registration submitted successfully',whatsappLink:process.env.WHATSAPP_COMMUNITY_LINK||null,summary:registration,participants:input.students,expo:input.expo?{teamName:input.expo.teamName,projectTitle:input.expo.projectTitle,category:input.expo.category,description:input.expo.description}:null,confirmationToken,emailDelivery:delivery};
}
export async function registrationDetail(id:string){const db=await getDb();const [registration]=await db.select().from(collegeRegistrations).where(eq(collegeRegistrations.id,id));if(!registration)return null;const people=await db.select().from(participants).where(eq(participants.registrationId,id));const [project]=await db.select().from(expoProjects).where(eq(expoProjects.registrationId,id));const team=project?await db.select().from(expoTeamMembers).where(eq(expoTeamMembers.projectId,project.id)):[];return {registration,participants:people,expoProject:project||null,teamMembers:team};}
