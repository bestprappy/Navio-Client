import {SearchCompass} from "@/components/icons/search-compass";
import { CircleHelp, Compass, Flame, Home, LayoutDashboard, MessageCircle } from 'lucide-react';

export const NAVIO_MENU = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Explore', href: '/explore', icon: Compass },
  { title: 'Community', href: '/community', icon: MessageCircle },
  { title: 'Help', href: '/help', icon: CircleHelp },
] as const;

export const COMMUNITY_NAV = [
  { title: 'Home', href: '/community', icon: Home },
  { title: 'Popular', href: '/community/popular', icon: Flame },
  { title: 'Explore', href: '/community/discovery', icon: SearchCompass },
] as const;

export function isNavioNavActive(pathname: string, href: string) {
  return pathname === href || href !== '/' && pathname.startsWith(`${href}/`);
}

/** Community groups and posts do not masquerade as the top-level Home feed. */
export function isCommunityNavActive(pathname: string, href: string) {
  if (href === '/community') return pathname === '/community';
  return isNavioNavActive(pathname, href);
}
