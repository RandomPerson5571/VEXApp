import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export type SlashCommand = {
  data: | SlashCommandBuilder 
    | SlashCommandOptionsOnlyBuilder 
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  modalSubmit?: (interaction: ModalSubmitInteraction) => Promise<void>;
};

export type BotEvent<K extends keyof ClientEvents = keyof ClientEvents> = {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => Promise<void> | void;
};

export type BotClient = Client & {
  commands: Collection<string, SlashCommand>;
};
