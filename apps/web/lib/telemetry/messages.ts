export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function taskCreatedMessage(title: string): string {
  return `Task created: **${title}**`;
}

export function taskUpdatedMessage(title: string, changes: string[]): string {
  const detail = changes.length > 0 ? changes.join(", ") : "details updated";
  return `Task updated: **${title}** (${detail})`;
}

export function eventCreatedMessage(name: string): string {
  return `Event created: **${name}**`;
}

export function eventUpdatedMessage(name: string): string {
  return `Event updated: **${name}**`;
}

export function eventDeletedMessage(name: string): string {
  return `Event deleted: **${name}**`;
}

export function scoutNoteCreatedMessage(targetTeam: string): string {
  return `Scout note created for team **${targetTeam}**`;
}

export function scoutNoteUpdatedMessage(targetTeam: string): string {
  return `Scout note updated for team **${targetTeam}**`;
}

export function scoutNoteDeletedMessage(targetTeam: string): string {
  return `Scout note deleted for team **${targetTeam}**`;
}

export function knowledgeNodeCreatedMessage(title: string): string {
  return `Knowledge node created: **${title}**`;
}

export function knowledgeNodeUpdatedMessage(title: string): string {
  return `Knowledge node updated: **${title}**`;
}

export function knowledgeNodeDeletedMessage(title: string): string {
  return `Knowledge node deleted: **${title}**`;
}

export function knowledgeEdgeCreatedMessage(): string {
  return "Knowledge edge created";
}

export function knowledgeEdgeDeletedMessage(): string {
  return "Knowledge edge deleted";
}

export function inviteCreatedMessage(maxUses: number): string {
  return `Invite link created (max ${maxUses} uses)`;
}

export function dayPlanCreatedMessage(date: string, type: string): string {
  return `Day plan created: **${date}** (${type})`;
}

export function dayPlanUpdatedMessage(date: string, type: string): string {
  return `Day plan updated: **${date}** (${type})`;
}

export function dayPlanDeletedMessage(date: string): string {
  return `Day plan deleted: **${date}**`;
}

export function inventoryItemCreatedMessage(name: string): string {
  return `Inventory item created: **${name}**`;
}

export function inventoryItemUpdatedMessage(name: string): string {
  return `Inventory item updated: **${name}**`;
}

export function inventoryItemDeletedMessage(name: string): string {
  return `Inventory item deleted: **${name}**`;
}

export function inventorySignOutMessage(
  itemName: string,
  quantity: number,
  userName: string,
): string {
  return `**${userName}** signed out **${quantity}** × **${itemName}**`;
}

export function inventoryReturnMessage(
  itemName: string,
  quantity: number,
  userName: string,
): string {
  return `**${userName}** returned **${quantity}** × **${itemName}**`;
}
