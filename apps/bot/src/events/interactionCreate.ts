import type { BotClient, BotEvent } from "../types.js";

const interactionCreate: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const client = interaction.client as BotClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "This command is not registered yet.",
        ephemeral: true,
      });
      return;
    }

    try {
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
