import { sendMessage } from "./utils/messaging";

export default defineContentScript({
  matches: ["https://*.awsapps.com/start/*"],
  async main() {
    console.log("running allow_access_confirm...");

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
        console.log("found allow access button", allowAccessButton);
        if (allowAccessButton) {
          allowAccessButton.click();
          setTimeout(() => {
            sendMessage("closeTab", undefined);
          }, 1000);
          clearInterval(intervalId);
        } else if (attempts >= 10) {
          clearInterval(intervalId);
        }
        attempts++;
      }, 200);
    }
  },
});
