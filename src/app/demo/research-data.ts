import { ANA, BEN, demoId, now } from "./identity"

export const researchTables = {
  idea_notes: [
    {
      id: demoId(33),
      idea_id: demoId(20),
      body: "Look for a campsite with a short walk to the river.",
      created_by: BEN,
      created_at: now,
    },
  ],
  research_links: [
    {
      id: demoId(34),
      idea_id: demoId(20),
      title: "Cederberg travel ideas",
      url: "https://www.cederberg.com",
      description: "Places to explore",
      created_by: ANA,
      created_at: now,
    },
  ],
  hypotheses: [
    {
      id: demoId(35),
      idea_id: demoId(20),
      statement: "A long weekend will give us enough time.",
      status: "untested",
      created_by: ANA,
      created_at: now,
    },
  ],
}
