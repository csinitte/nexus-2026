import nodemailer from 'nodemailer';
export async function sendRegistrationConfirmationEmail(summary:{registrationCode:string;collegeName:string;facultyCoordinatorEmail:string;totalRepresentatives:number;confirmationToken?:string|null}) {
 const summaryLink=summary.confirmationToken&&process.env.NEXUS_PUBLIC_URL?`${process.env.NEXUS_PUBLIC_URL.replace(/\/$/,'')}/summary#${encodeURIComponent(summary.registrationCode)}:${encodeURIComponent(summary.confirmationToken)}`:'';
 const text=`Registration confirmed: ${summary.registrationCode}\nCollege: ${summary.collegeName}\nDelegation size: ${summary.totalRepresentatives}\n${process.env.WHATSAPP_COMMUNITY_LINK || ''}\n${summaryLink ? `View your registration summary: ${summaryLink}` : ''}\nAccommodation is subject to availability. Expo abstracts are reviewed for theme relevance and are not jury pre-approved.`;
 if(!process.env.BREVO_SMTP_HOST||!process.env.BREVO_SMTP_USER||!process.env.BREVO_SMTP_PASS||!process.env.MAIL_FROM) {console.info('Confirmation email skipped: SMTP is not configured');return {status:'skipped' as const};}
 const transport=nodemailer.createTransport({host:process.env.BREVO_SMTP_HOST,port:Number(process.env.BREVO_SMTP_PORT)||587,secure:Number(process.env.BREVO_SMTP_PORT)===465,auth:{user:process.env.BREVO_SMTP_USER,pass:process.env.BREVO_SMTP_PASS}});
 const escaped=text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 await transport.sendMail({from:process.env.MAIL_FROM,to:summary.facultyCoordinatorEmail,subject:`NEXUS 2026 registration ${summary.registrationCode}`,text,html:`<p>${escaped.replace(/\n/g,'<br>')}</p>`});return {status:'sent' as const};
}
