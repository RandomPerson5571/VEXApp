import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
} from "discord.js";

type ReplyOptions = string | InteractionReplyOptions | InteractionEditReplyOptions;

export function startLatencyTimer(): () => number {
  const startedAt = Date.now();
  return () => Date.now() - startedAt;
}

export function formatCommandLatency(latencyMs: number): string {
  return `${latencyMs}ms`;
}

export function appendLatencyFooter(existingFooter: string | undefined, latencyMs: number): string {
  const latency = formatCommandLatency(latencyMs);
  return existingFooter ? `${existingFooter} · ${latency}` : latency;
}

export function injectLatencyIntoReply(
  options: ReplyOptions,
  latencyMs: number,
): InteractionReplyOptions | InteractionEditReplyOptions {
  if (typeof options === "string") {
    return {
      embeds: [
        new EmbedBuilder()
          .setDescription(options)
          .setFooter({ text: formatCommandLatency(latencyMs) }),
      ],
    };
  }

  const embeds = [...(options.embeds ?? [])];

  if (embeds.length > 0) {
    const lastEmbed = EmbedBuilder.from(embeds[embeds.length - 1]!);
    const existingFooter = lastEmbed.data.footer?.text;
    lastEmbed.setFooter({ text: appendLatencyFooter(existingFooter, latencyMs) });
    embeds[embeds.length - 1] = lastEmbed;

    return { ...options, embeds };
  }

  if (options.content) {
    return {
      ...options,
      content: undefined,
      embeds: [
        new EmbedBuilder()
          .setDescription(options.content)
          .setFooter({ text: formatCommandLatency(latencyMs) }),
      ],
    };
  }

  return {
    ...options,
    embeds: [
      new EmbedBuilder()
        .setDescription("\u200b")
        .setFooter({ text: formatCommandLatency(latencyMs) }),
    ],
  };
}

export function wrapInteractionWithLatency(interaction: ChatInputCommandInteraction): void {
  const getLatency = startLatencyTimer();
  let latencyInjected = false;

  const patchReply = (options: ReplyOptions): InteractionReplyOptions | InteractionEditReplyOptions => {
    if (latencyInjected) {
      return typeof options === "string" ? { content: options } : options;
    }

    latencyInjected = true;
    return injectLatencyIntoReply(options, getLatency());
  };

  const originalReply = interaction.reply.bind(interaction);
  const originalDeferReply = interaction.deferReply.bind(interaction);
  const originalEditReply = interaction.editReply.bind(interaction);
  const originalFollowUp = interaction.followUp.bind(interaction);

  interaction.reply = ((options) =>
    originalReply(patchReply(options as ReplyOptions) as InteractionReplyOptions)) as typeof interaction.reply;
  interaction.editReply = ((options) =>
    originalEditReply(
      patchReply(options as ReplyOptions) as InteractionEditReplyOptions,
    )) as typeof interaction.editReply;
  interaction.followUp = ((options) =>
    originalFollowUp(patchReply(options as ReplyOptions) as InteractionReplyOptions)) as typeof interaction.followUp;
  interaction.deferReply = ((options) => originalDeferReply(options)) as typeof interaction.deferReply;
}
