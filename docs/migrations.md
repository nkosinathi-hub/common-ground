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
