import { onMessage } from "./utils/messaging";

let userCodes: Record<number, string> = {};

export default defineBackground(() => {
  console.log("registering background script", { id: browser.runtime.id });

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
