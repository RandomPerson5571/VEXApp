import { describe, expect, it } from "vitest";

import { toGraphData } from "@/components/knowledge/knowledge-view-utils";
import type { KnowledgeNodeRecord } from "@/lib/queries/knowledge";

function node(id: string): KnowledgeNodeRecord {
  return {
    id,
    teamId: "t1",
    title: id,
    topicCategory: "GENERAL",
    contentType: "MARKDOWN",
    contentUrl: null,
    content: null,
    createdById: "u1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    createdBy: { id: "u1", firstName: "A", lastName: "B" },
  };
}

describe("toGraphData", () => {
  it("drops links that reference missing nodes", () => {
    const { links } = toGraphData(
      [node("a"), node("b")],
      [
        {
          id: "e1",
          sourceId: "a",
          targetId: "b",
          relationshipType: "RELATED_TO",
        },
        {
          id: "e2",
          sourceId: "a",
          targetId: "deleted",
          relationshipType: "RELATED_TO",
        },
      ],
    );

    expect(links).toEqual([
      {
        id: "e1",
        source: "a",
        target: "b",
        relationshipType: "RELATED_TO",
      },
    ]);
  });
});
