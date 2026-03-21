import { useEffect, useRef } from "react";
import { BACKEND_URL } from "@/lib/api";

const SSO_HUB_URL = BACKEND_URL + "/sso.html";

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
      if (event.origin !== backendOrigin) return;

      if (event.data.type === "AUTH_STATE") {
        const { token, userProfile } = event.data;
        if (onSync) onSync(token, userProfile);
      }
    };

    window.addEventListener("message", handleMessage);

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
