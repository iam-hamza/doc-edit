import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

const AUTOSAVE_DELAY_MS = 1500;

/**
 * Debounces title/content changes and PUTs them in the background.
 *
 * `preserveState: true` + `only: []` are what make this an autosave rather
 * than a normal save: they stop Inertia from merging any props back into the
 * page, so the editor's own local state stays authoritative and focus/cursor
 * position survives the request.
 */
export function useAutosave(
    url: string,
    title: string,
    content: string,
    enabled = true,
) {
    const isFirstRun = useRef(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Skip the mount-time run — there's nothing to save yet.
        if (isFirstRun.current) {
            isFirstRun.current = false;

            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            router.put(
                url,
                { title, content, silent: true },
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: [],
                },
            );
        }, AUTOSAVE_DELAY_MS);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [url, title, content, enabled]);
}
