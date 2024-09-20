import { sendMessage } from "./utils/messaging";

export default defineContentScript({
  matches: ["https://*.awsapps.com/start/*"],
  async main() {
    console.log("Granted: running allow_access_confirm...");

    const hashParams = new URLSearchParams(window.location.hash.slice(2));
    const clientId = hashParams.get("clientId");

    if (!clientId) {
      console.log("Granted: clientID parameter is missing in the URL hash.");
      return;
    }

    // Create and insert the banner
    const banner = document.createElement("div");
    banner.textContent = "Granted is confirming your access automatically...";
    banner.style.position = "fixed";
    banner.style.top = "0";
    banner.style.width = "100%";
    banner.style.backgroundColor = "#25a749";
    banner.style.color = "white";
    banner.style.textAlign = "center";
    banner.style.padding = "10px";
    banner.style.zIndex = "1000";
    banner.style.fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    document.body.prepend(banner);

    const userCodeIsSet = await sendMessage("userCodeIsSet", undefined);
    console.log({ userCodeIsSet });
    if (userCodeIsSet) {
      let attempts = 0;
      const intervalId = setInterval(() => {
        const allowAccessButton = document.querySelector(
          '[data-testid="allow-access-button"]',
        ) as HTMLElement;
        if (allowAccessButton) {
          console.log("Granted: found allow access button", allowAccessButton);
          allowAccessButton.click();

          let closeAttempts = 0;
          const maxCloseAttempts = 10;
          const closeMessageCheckInterval = setInterval(() => {
            if (
              document.body.textContent?.includes("You can close this window.")
            ) {
              clearInterval(closeMessageCheckInterval);
              sendMessage("closeTab", undefined);
            } else if (closeAttempts >= maxCloseAttempts) {
              clearInterval(closeMessageCheckInterval);
            }
            closeAttempts++;
          }, 200);
          clearInterval(intervalId);
        } else if (attempts >= 30) {
          clearInterval(intervalId);
        }
        attempts++;
      }, 200);
    }
  },
});
