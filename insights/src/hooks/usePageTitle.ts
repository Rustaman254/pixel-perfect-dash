import { useEffect } from "react";

const usePageTitle = (title: string, appName: string = "Watchtower") => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${appName}: ${title}`;

    return () => {
      document.title = previousTitle;
    };
  }, [title, appName]);
};

export default usePageTitle;
