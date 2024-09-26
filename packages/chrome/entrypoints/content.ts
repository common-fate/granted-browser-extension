import { sendMessage } from "./utils/messaging";

export default defineContentScript({
  matches: [
    "https://device.sso.af-south-1.amazonaws.com/*",
    "https://device.sso.ap-east-1.amazonaws.com/*",
    "https://device.sso.ap-northeast-1.amazonaws.com/*",
    "https://device.sso.ap-northeast-2.amazonaws.com/*",
    "https://device.sso.ap-northeast-3.amazonaws.com/*",
    "https://device.sso.ap-south-1.amazonaws.com/*",
    "https://device.sso.ap-southeast-1.amazonaws.com/*",
    "https://device.sso.ap-southeast-2.amazonaws.com/*",
    "https://device.sso.ap-southeast-3.amazonaws.com/*",
    "https://device.sso.ca-central-1.amazonaws.com/*",
    "https://device.sso.eu-central-1.amazonaws.com/*",
    "https://device.sso.eu-north-1.amazonaws.com/*",
    "https://device.sso.eu-south-1.amazonaws.com/*",
    "https://device.sso.eu-west-1.amazonaws.com/*",
    "https://device.sso.eu-west-2.amazonaws.com/*",
    "https://device.sso.eu-west-3.amazonaws.com/*",
    "https://device.sso.me-south-1.amazonaws.com/*",
    "https://device.sso.sa-east-1.amazonaws.com/*",
    "https://device.sso.us-east-1.amazonaws.com/*",
    "https://device.sso.us-east-2.amazonaws.com/*",
    "https://device.sso.us-gov-east-1.amazonaws.com/*",
    "https://device.sso.us-gov-west-1.amazonaws.com/*",
    "https://device.sso.us-west-1.amazonaws.com/*",
    "https://device.sso.us-west-2.amazonaws.com/*",
  ],
  async main() {
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
  },
});
