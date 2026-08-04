'use client';

import { Copy, Edit3, MoreHorizontal, Send, Trash2, Undo2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatSnakeCaseToTitleCase } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AdminListTileProps {
  title: string;
  subtitle: string;
  domain: string;
  status: string;
  isSelected: boolean;
  onTap: () => void;
  onAction: (action: string) => void;
  canPublish?: boolean;
  canDelete?: boolean;
}

export default function AdminListTile({
  title,
  subtitle,
  domain,
  status,
  isSelected,
  onTap,
  onAction,
  canPublish = true,
  canDelete = true,
}: AdminListTileProps) {
  const published = status.toLowerCase() === 'published';

  return (
    <div className={cn('group relative border-b transition-colors', isSelected ? 'bg-accent/12' : 'hover:bg-muted/45')}>
      <button
        aria-pressed={isSelected}
        className="w-full px-4 py-4 pr-12 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onClick={onTap}
        type="button"
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{formatSnakeCaseToTitleCase(title || 'Untitled')}</p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{formatSnakeCaseToTitleCase(subtitle || 'No description')}</p>
          </div>
          <Badge
            className={cn(
              'shrink-0 border-0 text-[10px]',
              published ? 'bg-emerald-100 text-emerald-800' : status.toLowerCase().includes('review') ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800',
            )}
            variant="secondary"
          >
            {status}
          </Badge>
        </div>
        {domain ? <p className="mt-2 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground/75">{formatSnakeCaseToTitleCase(domain)}</p> : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions for ${title}`}
            className="absolute right-2 top-12 -translate-y-1/2 opacity-70 group-hover:opacity-100"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => onAction('edit')}><Edit3 /> Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction('duplicate')}><Copy /> Duplicate</DropdownMenuItem>
          {canPublish ? (
            <DropdownMenuItem onSelect={() => onAction(published ? 'unpublish' : 'publish')}>
              {published ? <Undo2 /> : <Send />}{published ? 'Unpublish' : 'Publish'}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onAction('delete')} variant="destructive"><Trash2 /> Archive</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
