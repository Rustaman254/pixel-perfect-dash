import { useEffect } from "react";
import { useRef } from "react";
import { SSO_HUB_URL } from "@/lib/api";

export const useSSOSync = (onSync?: (token: string | null, userProfile: any | null) => void) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const backendOrigin = new URL(SSO_HUB_URL).origin;
    
    // Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.src = SSO_HUB_URL;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const handleMessage = (event: MessageEvent) => {
      // For localhost development, we trust the backend origin
      if (event.origin !== backendOrigin) return;

      if (event.data.type === "AUTH_STATE") {
        const { token, userProfile } = event.data;
        if (onSync) onSync(token, userProfile);
      }
    };

    window.addEventListener("message", handleMessage);

    // Initial check after iframe loads
    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ type: "GET_AUTH" }, backendOrigin);
    };

    return () => {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
  }, []);

  const setAuth = (token: string | null, userProfile: any | null) => {
    const backendOrigin = new URL(SSO_HUB_URL).origin;
    if (token && userProfile) {
      iframeRef.current?.contentWindow?.postMessage({ type: "SET_AUTH", token, userProfile }, backendOrigin);
    } else {
      iframeRef.current?.contentWindow?.postMessage({ type: "CLEAR_AUTH" }, backendOrigin);
    }
  };

  return { setAuth };
};
