import { EmbedBuilder } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendDiscordDm, sendDiscordDmBatch } from "../../src/services/discord-dm.js";
import type { BotClient } from "../../src/types.js";

function mockClient() {
  const send = vi.fn().mockResolvedValue(undefined);
  const fetch = vi.fn().mockResolvedValue({ send });

  return {
    client: { users: { fetch } } as unknown as BotClient,
    fetch,
    send,
  };
}

describe("sendDiscordDm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the user and sends an embed DM", async () => {
    const { client, fetch, send } = mockClient();
    const embed = new EmbedBuilder().setTitle("Push to main");

    await sendDiscordDm(client, "111222333444555666", embed);

    expect(fetch).toHaveBeenCalledWith("111222333444555666");
    expect(send).toHaveBeenCalledWith({
      embeds: [embed.toJSON()],
    });
  });

  it("logs and swallows delivery failures", async () => {
    const { client, fetch } = mockClient();
    const error = new Error("Cannot send messages to this user");
    fetch.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      sendDiscordDm(
        client,
        "111222333444555666",
        new EmbedBuilder().setTitle("test"),
      ),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      "[discord-dm] failed to DM 111222333444555666:",
      error,
    );
  });
});

describe("sendDiscordDmBatch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the same embed to every Discord ID", async () => {
    const { client, fetch, send } = mockClient();
    const embed = new EmbedBuilder().setTitle("Workflow Run");
    const discordIds = ["111", "222", "333"];

    await sendDiscordDmBatch(client, discordIds, embed);

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(send).toHaveBeenCalledTimes(3);
    for (const id of discordIds) {
      expect(fetch).toHaveBeenCalledWith(id);
    }
    for (const call of send.mock.calls) {
      expect(call[0]).toEqual({ embeds: [embed.toJSON()] });
    }
  });

  it("no-ops for an empty recipient list", async () => {
    const { client, fetch } = mockClient();

    await sendDiscordDmBatch(client, [], new EmbedBuilder().setTitle("test"));

    expect(fetch).not.toHaveBeenCalled();
  });
});
