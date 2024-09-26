import { onMessage } from "./utils/messaging";

let userCodes: Record<number, string> = {};

interface UserCodes {
  codes: UserCode[] | null;
}

interface UserCode {
  code: string;
  expiresAt: string;
}

export default defineBackground(async () => {
  console.log("registering background script", { id: browser.runtime.id });

  onMessage("getValidUserCodes", async () => {
    const result: UserCodes = await browser.runtime.sendNativeMessage(
      "io.commonfate.granted",
      {
        type: "get_valid_user_codes",
      },
    );

    console.log("get_valid_user_codes response: " + JSON.stringify(result));

    if (result.codes == null) {
      return [];
    }

    return result.codes.map((c) => c.code);
  });

  onMessage("setUserCode", (message) => {
    console.log("setUserCode called");
    if (message.sender.tab?.id !== undefined) {
      console.log(
        `setting user code for tab ${message.sender.tab.id}: ${message.data}`,
      );
      userCodes[message.sender.tab.id] = message.data;
    }
  });

  onMessage("userCodeIsSet", (message) => {
    console.log("userCodeIsSet called");
    if (message.sender.tab?.id === undefined) {
      console.log("userCodeIsSet: returning false because tab ID is undefined");
      return false;
    }

    if (userCodes[message.sender.tab.id] === undefined) {
      console.log(
        `userCodeIsSet: returning false because there is no code for the tab ID ${message.sender.tab.id}`,
      );
      return false;
    }

    console.log(
      `userCodeIsSet: returning true because there is a code for the tab ID ${message.sender.tab.id}: ${userCodes[message.sender.tab.id]}`,
    );

    delete userCodes[message.sender.tab.id];

    return true;
  });

  onMessage("closeTab", (message) => {
    if (message.sender.tab?.id !== undefined) {
      browser.tabs.remove(message.sender.tab.id);
    }
  });
});
