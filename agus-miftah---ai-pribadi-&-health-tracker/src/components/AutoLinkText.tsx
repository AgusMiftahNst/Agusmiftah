import React from 'react';
import { ExternalLink, FileText, FolderGit2, Link as LinkIcon } from 'lucide-react';

// Regex to detect standard URLs (http://, https://, or common web prefixes)
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi;

export interface ExtractedUrl {
  original: string;
  url: string;
  displayLabel: string;
  type: 'google-docs' | 'google-drive' | 'github' | 'spreadsheet' | 'general';
}

/**
 * Extracts and categorizes URLs from a text string
 */
export function extractUrls(text?: string | null): ExtractedUrl[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];

  // Remove duplicates
  const uniqueMatches = Array.from(new Set(matches));

  return uniqueMatches.map((m) => {
    let cleanUrl = m;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let type: ExtractedUrl['type'] = 'general';
    let displayLabel = cleanUrl;

    try {
      const parsed = new URL(cleanUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      const pathname = parsed.pathname;

      if (host.includes('docs.google.com')) {
        if (pathname.includes('/spreadsheets')) {
          type = 'spreadsheet';
          displayLabel = 'Google Spreadsheet';
        } else if (pathname.includes('/document')) {
          type = 'google-docs';
          displayLabel = 'Google Docs';
        } else if (pathname.includes('/presentation')) {
          type = 'google-docs';
          displayLabel = 'Google Slides';
        } else {
          type = 'google-docs';
          displayLabel = 'Google Docs';
        }
      } else if (host.includes('drive.google.com')) {
        type = 'google-drive';
        displayLabel = 'Google Drive';
      } else if (host.includes('github.com')) {
        type = 'github';
        displayLabel = `GitHub: ${pathname.slice(1, 24) || 'Repo'}`;
      } else {
        // Shorten long domain/path
        displayLabel = `${host}${pathname.length > 1 ? pathname.slice(0, 18) + '...' : ''}`;
      }
    } catch {
      displayLabel = cleanUrl.length > 25 ? cleanUrl.slice(0, 25) + '...' : cleanUrl;
    }

    return {
      original: m,
      url: cleanUrl,
      displayLabel,
      type
    };
  });
}

/**
 * Component that formats text with auto-detected clickable links
 */
export function AutoLinkText({
  text,
  className = ''
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;

  // Split text by URLs to preserve normal text while making links interactive
  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (URL_REGEX.test(part)) {
          // Reset regex state
          URL_REGEX.lastIndex = 0;
          const href = part.startsWith('http://') || part.startsWith('https://')
            ? part
            : `https://${part}`;

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/50 hover:decoration-indigo-600 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 break-all transition-colors"
              title={`Buka ${href}`}
            >
              <span>{part}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}

/**
 * Render direct high-contrast tap buttons for all detected URLs in notes
 */
export function QuickUrlButtons({
  text,
  className = ''
}: {
  text?: string | null;
  className?: string;
}) {
  const urls = extractUrls(text);
  if (urls.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 pt-1.5 ${className}`}>
      {urls.map((item, idx) => {
        return (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 transition-all active:scale-95 shadow-xs"
            title={`Buka tautan: ${item.url}`}
          >
            {item.type === 'google-docs' || item.type === 'spreadsheet' ? (
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            ) : item.type === 'google-drive' ? (
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            ) : item.type === 'github' ? (
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
            <span className="truncate max-w-[170px] sm:max-w-[240px]">
              {item.displayLabel}
            </span>
          </a>
        );
      })}
    </div>
  );
}
