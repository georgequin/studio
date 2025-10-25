'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  Newspaper,
  Upload,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Process Clipping', icon: Upload },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Newspaper className="text-primary" />
          </Button>
          <span className="text-lg font-semibold text-sidebar-foreground overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">
            NHRC AI Watch
          </span>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                as={Link}
                href={item.href}
                isActive={pathname === item.href}
                tooltip={{
                  children: item.label,
                  className:
                    'bg-sidebar-background text-sidebar-foreground border-sidebar-border',
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         {/* Footer content can be added here if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}
