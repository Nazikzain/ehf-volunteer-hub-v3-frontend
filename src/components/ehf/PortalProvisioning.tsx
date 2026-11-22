import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from './StatusBadge';
import { PageHeader } from './ui';
import { useWorkflow } from '@/lib/workflow-store';
import { useDemoActor } from '@/lib/demo-context';
import { acceptedVolunteers, accountStatus, getAccess, inviteAccount, setAccess, setAccountAccess, useAccess } from '@/lib/portal-access';
import { isTechnical } from '@/lib/demo-roles';
import { toast } from 'sonner';
export function PortalProvisioning({ embedded = false }: { embedded?: boolean }) {
 const wf=useWorkflow(), actor=useDemoActor(), s=useAccess();
 const [id,setId]=useState<string|null>(null),[query,setQuery]=useState(''),[filter,setFilter]=useState('');
 const now=new Date().toISOString(); const technical=isTechnical(actor);
 const rows=acceptedVolunteers(wf).filter(v=>`${v.name} ${v.email} ${v.id}`.toLowerCase().includes(query.toLowerCase())&&(!filter||accountStatus(s.accounts.find(a=>a.volunteerId===v.id),now)===filter));
 const account=s.accounts.find(a=>a.volunteerId===id),v=wf.volunteers.find(v=>v.id===id);
 function act(fn:()=>void) {try{fn();}catch(e){toast.error(e instanceof Error?e.message:'Action failed');}}
 function invite(vid:string,recovery=false) {act(()=>{setAccess(inviteAccount(getAccess(),wf,vid,actor,new Date().toISOString(),recovery?'recovery':'activation'));setId(vid);});}
 return <>
 {embedded?<h2 className="mb-4 mt-8 text-lg font-bold">Volunteer Portal Accounts</h2>:<PageHeader title="Volunteer Portal Accounts" subtitle="Synthetic accounts · invitations and recovery are simulated"/>}
 <div className="mb-4 flex flex-wrap gap-3"><input aria-label="Search portal accounts" placeholder="Search name, email or Volunteer ID" className="min-w-0 flex-1 rounded-md border bg-card px-3 py-2" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Account status filter" className="rounded-md border bg-card px-3 py-2" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All account statuses</option>{['Not Created','Invitation Pending','Active','Invitation Expired','Suspended'].map(x=><option key={x}>{x}</option>)}</select></div>
 <div className="grid gap-3">{rows.map(v=>{const a=s.accounts.find(a=>a.volunteerId===v.id),status=accountStatus(a,now);return <article key={v.id} className="rounded-md border bg-card p-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{v.name} · {v.id}</h3><p className="break-all text-sm">{v.email}</p><p className="text-xs text-muted-foreground">Accepted application · Volunteer role only</p></div><StatusBadge status={status}/></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setId(v.id)}>Account details</Button>{technical&&<>{['Not Created','Invitation Pending','Invitation Expired'].includes(status)&&<Button onClick={()=>invite(v.id)}>{status==='Not Created'?'Create account & invite':'Resend invitation'}</Button>}{status==='Active'&&<Button variant="outline" onClick={()=>invite(v.id,true)}>Reset access (simulated)</Button>}{a&&status!=='Suspended'&&<Button variant="outline" onClick={()=>act(()=>setAccess(setAccountAccess(getAccess(),v.id,actor,'Suspended',now)))}>Suspend access</Button>}{status==='Suspended'&&<Button onClick={()=>act(()=>setAccess(setAccountAccess(getAccess(),v.id,actor,'Active',now)))}>Reactivate access</Button>}</>}</div></article>})}</div>
 {!rows.length&&<p className="text-sm text-muted-foreground">No accepted volunteers match this list.</p>}
 <Dialog open={!!id} onOpenChange={o=>!o&&setId(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{v?.name} · Portal account</DialogTitle></DialogHeader><p>{v?.id} · {v?.email}</p><p>Account status: {accountStatus(account,now)}</p>{account?.invitation&&<><h3 className="font-bold">Simulated invitation email</h3><p className="break-all">To: {account.email}</p><p>Subject: Your EHF Volunteer Portal Account</p><p>Dear {v?.name},</p><p>Welcome to the Ethnic Health Forum Volunteer Hub. Your application has been accepted. Your login email is {account.email}. Create your own password to activate portal access.</p><p>View your profile, assigned projects and tasks, attendance, hours, feedback and certificates.</p><p>Kind regards,<br/>Ethnic Health Forum Team</p><p className="text-xs text-muted-foreground">No email was sent. Demo marker expires: {new Date(account.invitation.expiresAt).toLocaleString('en-GB')}. Use this in the same preview tab; reloading clears it.</p>{technical&&<Button asChild><Link to="/portal-activate" search={{invitation:account.invitation.marker}} onClick={()=>setId(null)}>Open demo activation screen</Link></Button>}</>}
 <h3 className="font-bold">Account history</h3>{account?.history.map((h,i)=><p key={i} className="text-sm">{h.at} · {h.action} · {h.by}</p>)}{!account&&<p>No portal login has been created.</p>}</DialogContent></Dialog>
 </>;
}
