import { useEffect } from 'react';

export function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · BAC II StudyHub` : 'BAC II StudyHub';
    }, [title]);
}
