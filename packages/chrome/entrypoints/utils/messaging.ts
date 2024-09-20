import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  setUserCode(code: string): void;
  userCodeIsSet(): boolean;
  closeTab(): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
