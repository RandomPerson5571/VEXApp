import type { BotClient, BotEvent } from "../types.js";
import { wrapInteractionWithLatency } from "../utils/latency.js";

const interactionCreate: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(interaction) {
    const client = interaction.client as BotClient;

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command?.autocomplete) {
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(`Error autocompleting /${interaction.commandName}:`, error);
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      const commandName = interaction.customId.split(":")[0];
      const command = commandName ? client.commands.get(commandName) : undefined;

      if (!command?.modalSubmit) {
        return;
      }

      try {
        await command.modalSubmit(interaction);
      } catch (error) {
        console.error(`Error handling modal for /${commandName}:`, error);
        const errorReply = {
          content: "Something went wrong while processing that form.",
          ephemeral: true,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(errorReply);
        } else {
          await interaction.reply(errorReply);
        }
      }

      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "This command is not registered yet.",
        ephemeral: true,
      });
      return;
    }

    try {
      wrapInteractionWithLatency(interaction);
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing /${interaction.commandName}:`, error);
      const errorReply = { content: "Something went wrong while running that command.", ephemeral: true };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    }
  },
};

export default interactionCreate;
