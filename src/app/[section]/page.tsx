import { notFound } from 'next/navigation';
import Home from '../page';
const sections=['about','schedule','panel','showcase','expo','contact'] as const;
export function generateStaticParams(){return sections.map(section=>({section}));}
export default async function InformationPage({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section as typeof sections[number]))notFound();return <div className={`information-page show-${section}`}><Home/></div>;}
