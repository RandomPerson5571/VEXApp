import { vi } from "vitest";

type InteractionOptions = {
  userId?: string;
  guildId?: string;
  customId?: string;
  fields?: Record<string, string>;
  options?: Record<string, string | null>;
  focused?: { name: string; value: string };
};

export function createGuildInteractionStub(options: InteractionOptions = {}) {
  const userId = options.userId ?? "111222333444555666";
  const guildId = options.guildId ?? "987654321098765432";

  const user = {
    id: userId,
    displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png",
  };

  return {
    user,
    guild: { id: guildId },
    guildId,
    inGuild: () => true,
    reply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    deferReply: vi.fn().mockResolvedValue(undefined),
    showModal: vi.fn().mockResolvedValue(undefined),
    respond: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: (name: string) => options.options?.[name] ?? null,
      getInteger: () => null,
      getBoolean: (name: string) => {
        const value = options.options?.[name];
        if (value === "true") return true;
        if (value === "false") return false;
        return null;
      },
      getUser: () => null,
      getFocused: () =>
        options.focused ?? { name: "task", value: "" },
    },
    fields: {
      getTextInputValue: (name: string) => options.fields?.[name] ?? "",
    },
    customId: options.customId ?? "create-task:Software:Medium",
    isAutocomplete: () => Boolean(options.focused),
  };
}

export function createChatInputInteractionStub(
  options: InteractionOptions = {},
) {
  return createGuildInteractionStub(options);
}

export function createModalSubmitInteractionStub(
  options: InteractionOptions = {},
) {
  return createGuildInteractionStub(options);
}

export function createAutocompleteInteractionStub(
  options: InteractionOptions = {},
) {
  return createGuildInteractionStub({
    ...options,
    focused: options.focused ?? { name: "task", value: "" },
  });
}
