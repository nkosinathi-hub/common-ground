-- Each tag is 1 to 40 characters (the client's TAG_MAX). Without a subquery in a check, the
-- tags are joined on a unit separator and no run between separators may reach 41 characters.
-- NOT VALID: rows saved before this rule keep their tags; every new insert or update is checked.
alter table public.ideas add constraint ideas_tag_length check (
  '' <> all (tags)
  and array_to_string(tags, chr(31)) !~ ('[^' || chr(31) || ']{41}')
) not valid;
