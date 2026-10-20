import { ok, type MemberDirectory } from "@/shared/domain"
import type { LinkOption, LinkSearch } from "../application/ports"
import { CalendarService } from "../application/calendar-service"
import type { EventDraft } from "../domain"
import { InMemoryCalendar } from "./in-memory-calendar"

const MEMBERS = [
  { id: "ana", displayName: "Ana" },
  { id: "ben", displayName: "Ben" },
]

const members: MemberDirectory = { members: async () => ok(MEMBERS) }

const OPTIONS: LinkOption[] = [
  { kind: "watch_item", id: "w1", label: "Dune" },
  { kind: "idea", id: "i1", label: "Tea bar" },
  { kind: "task", id: "t1", label: "Book the stall" },
]

class FakeLinks implements LinkSearch {
  async search(_spaceId: string, kind: LinkOption["kind"], query: string) {
    const q = query.toLowerCase()
    return ok(OPTIONS.filter((o) => o.kind === kind && o.label.toLowerCase().includes(q)))
  }
  async watchNight() {
    return ok(OPTIONS.filter((o) => o.kind === "watch_item"))
  }
}

export const draft = (patch: Partial<EventDraft> = {}): EventDraft => ({
  title: "Movie night",
  description: "",
  location: "",
  allDay: false,
  startDate: "2026-10-16",
  endDate: "2026-10-16",
  startTime: "19:00",
  endTime: "21:00",
  timeZone: "UTC",
  repeatsYearly: false,
  link: null,
  reminders: [60],
  ...patch,
})

/** A calendar service over in-memory storage, signed in as `me`. */
export function setup(me = "ana") {
  const repo = new InMemoryCalendar(me)
  return { repo, service: new CalendarService(repo, new FakeLinks(), members) }
}
