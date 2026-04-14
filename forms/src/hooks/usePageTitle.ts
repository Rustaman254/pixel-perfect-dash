import { useEffect } from 'react';

const usePageTitle = (title: string, appName: string = 'Ripplify') => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${appName}: ${title}`;
    
    return () => {
      document.title = prevTitle;
    };
  }, [title, appName]);
};

export default usePageTitle;
