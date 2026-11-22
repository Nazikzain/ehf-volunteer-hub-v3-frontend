import { describe, it, expect } from 'vitest';
import { initialPortal, type PerformanceValues } from '@/lib/portal-workflow';
import { savePerformance, publishedReviews, overallRating, acknowledgePerformance } from '@/lib/performance-workflow';
import type { Actor } from '@/lib/attendance';
const admin:Actor={role:'Admin',accountId:'U-02',name:'Demo Primary',projects:[]};
const supervisor:Actor={role:'Admin',accountId:'U-03',name:'Demo Sarah',projects:['Community Wellbeing Programme']};
const volunteer:Actor={role:'Volunteer',name:'Demo Amina',volunteerId:'V-1042',projects:[]};
const at='2026-11-11T15:03:00Z';
const v:PerformanceValues={volunteerId:'V-1042',projectId:'P-1',date:'2026-11-11',reviewer:'Forged reviewer',ratings:[1,2,3,4,5],strengths:'Reliable community support',improvements:'More detailed reports',comments:'Thoughtful and effective work',recommendations:'Continue facilitation training'};
function fixture(){return {...structuredClone(initialPortal),performance:[]};}
describe('shared performance reviews',()=>{
 it('averages all five criteria to one decimal place',()=>{expect(overallRating([1,2,3,4,5])).toBe('3.0');expect(overallRating([4,4,5,4,4])).toBe('4.2');});
 it.each([0,6,2.5,NaN])('rejects an invalid criterion %s',n=>{expect(()=>savePerformance(fixture(),admin,undefined,{...v,ratings:[1,2,n,4,5]},true,at)).toThrow('1 to 5');});
 it('requires exactly five ratings',()=>{expect(()=>savePerformance(fixture(),admin,undefined,{...v,ratings:[1,2,3,4]},true,at)).toThrow('five');});
 it('requires meaningful written feedback for publication',()=>{expect(()=>savePerformance(fixture(),admin,undefined,{...v,strengths:'OK'},true,at)).toThrow('meaningful');expect(()=>savePerformance(fixture(),admin,undefined,{...v,comments:''},true,at)).toThrow('meaningful');});
 it('keeps new drafts private and publishes all fields unchanged with trusted reviewer',()=>{let s=savePerformance(fixture(),admin,undefined,v,false,at);expect(publishedReviews(s,volunteer)).toEqual([]);s=savePerformance(s,admin,s.performance[0]?.id,v,true,at);expect(publishedReviews(s,volunteer)[0]).toMatchObject({...v,reviewer:'Demo Primary',status:'Published'});});
 it('preserves last publication during editing and appends versions and audit on republish',()=>{let s=savePerformance(fixture(),admin,undefined,v,true,at);const id=s.performance[0]?.id;s=savePerformance(s,supervisor,id,{...v,comments:'Updated detailed feedback'},false,at);expect(publishedReviews(s,volunteer)[0]?.comments).toBe(v.comments);s=savePerformance(s,supervisor,id,{...v,comments:'Updated detailed feedback'},true,at);expect(publishedReviews(s,volunteer)[0]?.comments).toBe('Updated detailed feedback');expect(s.performance[0]?.versions?.map(x=>x.values.comments)).toEqual([v.comments,'Updated detailed feedback','Updated detailed feedback']);expect(s.performance[0]?.history).toHaveLength(3);});
 it('hides a review from another volunteer',()=>{const s=savePerformance(fixture(),admin,undefined,v,true,at);expect(publishedReviews(s,{...volunteer,volunteerId:'V-1038'})).toEqual([]);});
 it.each(['Volunteer','Technical System Administrator'] as const)('refuses %s organisational editing',role=>{expect(()=>savePerformance(fixture(),{...admin,role},undefined,v,true,at)).toThrow('scope');});
 it('limits supervisor creation and edits to authorised assigned projects',()=>{expect(()=>savePerformance(fixture(),supervisor,undefined,{...v,projectId:'P-2'},true,at)).toThrow('scope');const s=savePerformance(fixture(),admin,undefined,{...v,projectId:'P-2'},true,at);expect(()=>savePerformance(s,supervisor,s.performance[0]?.id,v,true,at)).toThrow('scope');expect(()=>savePerformance(fixture(),admin,undefined,{...v,volunteerId:'V-1038'},true,at)).toThrow('assigned');});
 it('permits acknowledgement only of own published review and never changes evaluation',()=>{const s=savePerformance(fixture(),admin,undefined,v,true,at),id=s.performance[0]?.id;if(!id)throw new Error('fixture');expect(()=>acknowledgePerformance(s,{...volunteer,volunteerId:'V-1038'},id,at)).toThrow('own');const next=acknowledgePerformance(s,volunteer,id,at);expect(next.performance[0]?.ratings).toEqual([1,2,3,4,5]);expect(next.performance[0]?.acknowledgedAt).toBe(at);});
 it('preserves existing demo reviews and their original snapshot on edit',()=>{const s=savePerformance(initialPortal,admin,'PR-1',{...v,comments:'Changed demo evaluation'},true,at);expect(s.performance).toHaveLength(2);expect(s.performance.find(r=>r.id==='PR-1')?.versions?.[0]?.values.ratings).toEqual([4,4,5,4,4]);});
});
