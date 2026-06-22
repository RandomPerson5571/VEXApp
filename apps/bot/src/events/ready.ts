import type { BotEvent } from "../types.js";

const ready: BotEvent<"clientReady"> = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
  },
};

export default ready;
