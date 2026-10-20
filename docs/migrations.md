# Migrations

How migration files relate to each other. Ranges and naming are in CONVENTIONS.md.

- Cleanup fixes to v0.1 tables use the spaces range: `000500` Home cards default, `000600`
  comment and recommendation write limits.

- A function redefined by a later file lives in the latest one; read that before changing it, and
  redefine it in a new file (with a comment naming the file it replaces), never by editing an
  applied one. Redefined today (latest last):

  | Function                                    | Files (time part)                              |
  | ------------------------------------------- | ---------------------------------------------- |
  | `delete_space`                              | `20261015 000700`, `001300`                    |
  | `remove_member`                             | `20261015 000700`, `20261016 000400`           |
  | `change_idea_currency`                      | `20261015 200700`, `200900`                    |
  | `tasks_notify_assignee`                     | `20261015 200600`, `200900`, `20261016 200400` |
  | `export_space`                              | `20261015 400200`, `20261016 400300`           |
  | `export_table_names`, `export_table_filter` | `20261015 400100`, `20261016 400100`, `400400` |
  | `export_table_rows`                         | `20261015 400100`, `20261016 400200`, `400500` |

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
