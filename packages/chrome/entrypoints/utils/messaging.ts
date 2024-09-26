import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  setUserCode(code: string): void;
  userCodeIsSet(): boolean;
  getValidUserCodes(): string[];
  closeTab(): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
