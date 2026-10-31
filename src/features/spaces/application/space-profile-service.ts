import { appError, err, ok, type HomeCardId, type Result } from "@/shared/domain"
import { storedLook, type DefaultWatchIntent, type WeekStart } from "../domain/look"
import { MEDIA_BYTES_MAX, mediaPath, type MediaSlot } from "../domain/media"
import { validateDescription, validateIcon, validateTagline } from "../domain/profile"
import { validateSpaceName } from "../domain/space"
import type { SpaceLook } from "../domain/space-look"
import type { SpaceTemplateId } from "../domain/templates"
import type { SpaceProfileGateway } from "./ports"

export interface GeneralFields {
  readonly name: string
  readonly template: SpaceTemplateId
  readonly tagline: string
  readonly description: string
  readonly icon: string | null
}

export interface PreferenceFields {
  readonly defaultWatchIntent: DefaultWatchIntent
  readonly weekStartsOn: WeekStart
}

const TOO_BIG = "Pictures can be up to 5 MB"
const WRONG_TYPE = "Use a JPEG, PNG or WebP picture"

/** The owner's customisation of a space: words, look, Home layout, defaults and pictures. */
export class SpaceProfileService {
  constructor(
    private readonly gateway: SpaceProfileGateway,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  async saveGeneral(spaceId: string, fields: GeneralFields): Promise<Result<void>> {
    const name = validateSpaceName(fields.name)
    if (!name.ok) return name
    const tagline = validateTagline(fields.tagline)
    if (!tagline.ok) return tagline
    const description = validateDescription(fields.description)
    if (!description.ok) return description
    const icon = validateIcon(fields.icon)
    if (!icon.ok) return icon
    return this.gateway.updateProfile(spaceId, {
      name: name.value,
      template: fields.template,
      tagline: tagline.value,
      description: description.value,
      icon: icon.value,
    })
  }

  /** The look as chosen; parseLook already normalised it, and the database checks it again. */
  saveLook = (spaceId: string, look: SpaceLook) =>
    this.gateway.updateProfile(spaceId, { look: storedLook(look) })

  saveHomeCards = (spaceId: string, homeCards: readonly HomeCardId[]) =>
    this.gateway.updateProfile(spaceId, { homeCards })

  savePreferences = (spaceId: string, fields: PreferenceFields) =>
    this.gateway.updateProfile(spaceId, { ...fields })

  /** Uploads under a new name, points the slot at it, then removes the picture it replaced. */
  async replaceMedia(spaceId: string, slot: MediaSlot, file: Blob): Promise<Result<string>> {
    if (file.size > MEDIA_BYTES_MAX) return err(appError("validation", TOO_BIG))
    const path = mediaPath(spaceId, slot, this.newId(), file.type)
    if (!path) return err(appError("validation", WRONG_TYPE))
    const uploaded = await this.gateway.uploadMedia(path, file)
    if (!uploaded.ok) return uploaded
    const previous = await this.gateway.setMedia(spaceId, slot, path)
    if (!previous.ok) {
      await this.gateway.removeMedia([path])
      return previous
    }
    await this.removeQuietly(previous.value)
    return ok(path)
  }

  async clearMedia(spaceId: string, slot: MediaSlot): Promise<Result<void>> {
    const previous = await this.gateway.setMedia(spaceId, slot, null)
    if (!previous.ok) return previous
    await this.removeQuietly(previous.value)
    return ok(undefined)
  }

  /** A failed removal leaves an orphan that the scheduled cleanup removes later. */
  private async removeQuietly(path: string | null) {
    if (path) await this.gateway.removeMedia([path])
  }
}
