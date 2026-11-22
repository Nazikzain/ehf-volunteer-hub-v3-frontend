import { createFileRoute } from '@tanstack/react-router';
import { PortalProvisioning } from '@/components/ehf/PortalProvisioning';
import { meta } from '@/lib/meta';
export const Route=createFileRoute('/admin/portal-access')({head:()=>meta('Volunteer Portal Accounts'),component:PortalProvisioning});
