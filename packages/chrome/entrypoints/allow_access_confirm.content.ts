import { sendMessage } from "./utils/messaging";

export default defineContentScript({
  matches: ["https://*.awsapps.com/start/*"],
  async main() {
    console.log("Granted: running allow_access_confirm...");

    const start = Date.now();
    const checkInterval = setInterval(() => {
      if (document.body.textContent?.includes("Allow access to your data?")) {
        clearInterval(checkInterval);
        void automateConfirmAccess();
      } else if (Date.now() - start > 20000) {
        // 20 seconds
        clearInterval(checkInterval);
      }
    }, 200);

    const checkIntervalAuthzRequested = setInterval(() => {
      if (document.body.textContent?.includes("Authorization requested")) {
        clearInterval(checkIntervalAuthzRequested);
        void confirmUserCode();
      } else if (Date.now() - start > 20000) {
        // 20 seconds
        clearInterval(checkIntervalAuthzRequested);
      }
    }, 200);
  },
});

async function automateConfirmAccess() {
  console.log("Granted: confirming access...");

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
}

async function confirmUserCode() {
  console.log("Granted: confirming user code...");

  // Create and insert the banner
  const banner = document.createElement("div");
  banner.textContent = "Granted is confirming your code automatically...";
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

  const userCodeElement = document.getElementById("user-code");
  if (userCodeElement) {
    const userCode = userCodeElement.textContent;
    console.log("Granted: got user code: " + userCode);

    if (userCode) {
      try {
        const validCodes = await sendMessage("getValidUserCodes", undefined);
        console.log("valid user codes:", validCodes);

        if (validCodes.includes(userCode)) {
          await sendMessage("setUserCode", userCode);
          document.getElementById("cli_verification_btn")?.click();
        } else {
          banner.textContent = `This code doesn't match any valid codes from the Granted CLI: ${validCodes.join(", ")}. Try closing the browser tab and running the last Granted CLI command again.`;
          banner.style.backgroundColor = "red";

          const btn = document.getElementById("cli_verification_btn");

          if (btn != null) {
            console.log("disabling button");
            btn.setAttribute("disabled", "true");
            btn.style.cursor = "not-allowed";
            btn.classList.remove("awsui-button-variant-primary");
          }
        }
      } catch (error: any) {
        console.error("Error:", error);
        if (error.message.includes("Failed to fetch")) {
          banner.textContent =
            "Couldn't confirm the code with the Granted CLI.  Try closing the browser tab and running the last Granted CLI command again.";
          banner.style.backgroundColor = "red";

          const btn = document.getElementById("cli_verification_btn");

          if (btn != null) {
            console.log("Granted: disabling button");
            btn.setAttribute("disabled", "true");
            btn.style.cursor = "not-allowed";
            btn.classList.remove("awsui-button-variant-primary");
          }
        } else {
          if (error.message.includes("Failed to fetch")) {
            banner.style.whiteSpace = "pre";
            banner.textContent = `The Granted browser extension encountered an error: ${error.message}.\r\nDon't click the 'Confirm' button unless you are sure the code matches what is shown in your own terminal.`;
            banner.style.backgroundColor = "red";
          }
        }
      }
    }
  }
}
