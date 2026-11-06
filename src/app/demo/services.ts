import { compose } from "../composition"
import { demoClient } from "./client"
import { demoPlayback } from "./playback"

/** Reuse production services, components and player; substitute only sample data and media. */
export function composeDemo() {
  const services = compose(demoClient())
  services.playback = demoPlayback(services.playback.device)
  return services
}
