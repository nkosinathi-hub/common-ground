# Migrations

How migration files relate to each other. Ranges and naming are in CONVENTIONS.md.

- Cleanup fixes to v0.1 tables use the spaces range: `000500` Home cards default, `000600`
  comment and recommendation write limits.

- A function redefined by a later file lives in the latest one; read that before changing it, and
  redefine it in a new file (with a comment naming the file it replaces), never by editing an
  applied one. Redefined today (latest last):

  | Function                                    | Files (time part)                                                 |
  | ------------------------------------------- | ----------------------------------------------------------------- |
  | `delete_space`                              | `20261015 000700`, `001300`                                       |
  | `remove_member`                             | `20261015 000700`, `20261016 000400`                              |
  | `change_idea_currency`                      | `20261015 200700`, `200900`                                       |
  | `tasks_notify_assignee`                     | `20261015 200600`, `200900`, `20261016 200400`                    |
  | `export_space`                              | `20261015 400200`, `20261016 400300`, `20261029 000300`           |
  | `export_me`                                 | `20261015 400300`, `20261022 000420`                              |
  | `export_table_names`, `export_table_filter` | `20261015 400100`, `20261016 400100`, `400400`, `20261022 001700` |
  | `export_table_rows`                         | `20261015 400100`, `20261016 400200`, `400500`                    |
  | `list_watch_items`                          | `20261015 100600`, `20261022 000300` (adds places and together)   |

- Grants: the foundation migration revokes everything on tables from `anon` and `authenticated`
  by default, so a new table needs no `revoke all`; grant exactly the columns and verbs the app
  uses. Functions get an explicit `grant execute ... to authenticated` for client
  RPCs and `revoke execute ... from public, anon, authenticated` for triggers and helpers.

- v0.3 files are dated `20261020`: `000100-099999` platform (API exposure, foreign-key indexes).
  `000100` drops `pg_graphql`; the API is PostgREST only (`api_exposure.test.sql`).
  `000200` indexes the foreign keys a parent delete follows. The rule (`foreign_key_indexes.test.sql`):
  an index on exactly the key's columns, or leading with the parent id, which is enough for a
  `(space_id, parent_id)` key because ids are unique. Author links to `profiles` (`created_by`,
  `author_id` and similar, `on delete set null`) stay unindexed: they fire only on account deletion.
  Splinter's `unindexed_foreign_keys` (INFO) accepts exact matches only, so it still lists ~49.

- v0.4 files are dated `20261021`: `000100-099999` push. `000100` push devices (tokens, RPCs),
  `000200` delivery: an insert trigger on `notifications` queues a pg_net call to the `push` Edge
  Function, configured in Vault by `configure_push` at deploy (docs/runbooks/push.md). Grants are
  explicit in each file, so v0.4 needs no `990000` file.

- v0.5 files are dated `20261022`: `000100-000999` episode history and personal progress
  (`000100` episode_watches and together_progress, `000200` the forward-only
  `episode_watches_advance` trigger and `mark_episode_watched`), `000400-000499` Simkl import
  (`000400` simkl_links, token readable by the service role only, `000410`
  `import_simkl_watches`, service role only, `000420` export_me with the link), `000500`
  Simkl AUTH V2: refresh token, device code, expiries and the `claim_simkl_refresh` lease,
  `001000-001999` watch parties:
  `001100-001500` parties, RPCs and expiry,
  `001600` Realtime policies for `party:<id>` topics, `001700` export, `001900` grants (last).
  `002000-002099` Netflix parties (#66): `002000` adds the `netflix` party source and lets
  `start_party` accept any `party_source`.

- v0.6 files are dated `20261029`: `000100-000999` the space look (#75). `000100` the `look`
  JSON on `spaces` with `is_valid_space_look` (theme and accent_color stay for older builds and
  are mapped into the look once), `000200` the `background` space-media slot
  (`background_path`; redefines `space_media_space`, `set_space_media` and
  `space_media_cleanup_candidates`), `000300` `export_space` with the look, `000400` the
  `on_your_mind` Home card (#76; redefines `is_valid_home_cards` and the `home_cards` default),
  `000500` `episode_statuses` for the Episodes tab (#77; security invoker, so RLS scopes it),
  `000600` `watch_opinions` (private like / dislike; drops `watch_progress.rating` and
  redefines `save_watch_progress` without it), `000700` comment threads (`reply_to`, the
  `season`/`episode` tag, `comment_reactions`), `000710` `post_comment` with replies and the tag, `000800` party
  sessions (the range and `party_id` on `watch_sessions`; redefines `finish_party`), `000900`
  `export_table_names` and `export_table_filter` with the two new tables.
