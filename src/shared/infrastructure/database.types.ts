
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activity_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"event_type": string,"id": string,"space_id": string,"subject_id": string,"subject_type": string,"target_id": string | null,"visible_to": (string)[] | null,"by_me": boolean | null
                  }
                  ComputedFields: "by_me"
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type": string,"id"?: string,"space_id": string,"subject_id": string,"subject_type": string,"target_id"?: string | null,"visible_to"?: (string)[] | null
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type"?: string,"id"?: string,"space_id"?: string,"subject_id"?: string,"subject_type"?: string,"target_id"?: string | null,"visible_to"?: (string)[] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_events_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attachments": {
                  Row: {
                    "bytes": number,"created_at": string,"declared_mime": string,"filename": string,"finalized_at": string | null,"id": string,"idea_id": string,"object_path": string | null,"space_id": string,"status": Database["public"]['Enums']["attachment_status"],"uploader_id": string | null,"verified_mime": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes": number,"created_at"?: string,"declared_mime": string,"filename": string,"finalized_at"?: string | null,"id"?: string,"idea_id": string,"object_path"?: never,"space_id": string,"status"?: Database["public"]['Enums']["attachment_status"],"uploader_id"?: string | null,"verified_mime"?: string | null
                  }
                  Update: {
                    "bytes"?: number,"created_at"?: string,"declared_mime"?: string,"filename"?: string,"finalized_at"?: string | null,"id"?: string,"idea_id"?: string,"object_path"?: never,"space_id"?: string,"status"?: Database["public"]['Enums']["attachment_status"],"uploader_id"?: string | null,"verified_mime"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "attachments_uploader_id_fkey"
      columns: ["uploader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"budget_entries": {
                  Row: {
                    "actual_minor": number,"category": string,"created_at": string,"created_by": string | null,"estimated_minor": number,"id": string,"idea_id": string,"label": string,"space_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actual_minor"?: number,"category": string,"created_at"?: string,"created_by"?: string | null,"estimated_minor"?: number,"id"?: string,"idea_id": string,"label": string,"space_id": string,"updated_at"?: string
                  }
                  Update: {
                    "actual_minor"?: number,"category"?: string,"created_at"?: string,"created_by"?: string | null,"estimated_minor"?: number,"id"?: string,"idea_id"?: string,"label"?: string,"space_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_entries_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budget_entries_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"calendar_event_attendees": {
                  Row: {
                    "added_by": string | null,"created_at": string,"event_id": string,"responded_at": string | null,"rsvp": Database["public"]['Enums']["event_rsvp"],"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_by"?: string | null,"created_at"?: string,"event_id": string,"responded_at"?: string | null,"rsvp"?: Database["public"]['Enums']["event_rsvp"],"space_id": string,"user_id": string
                  }
                  Update: {
                    "added_by"?: string | null,"created_at"?: string,"event_id"?: string,"responded_at"?: string | null,"rsvp"?: Database["public"]['Enums']["event_rsvp"],"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_event_attendees_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_event_attendees_space_id_event_id_fkey"
      columns: ["space_id","event_id"]
isOneToOne: false
      referencedRelation: "calendar_events"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "calendar_event_attendees_space_id_user_id_fkey"
      columns: ["space_id","user_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    }
                  ]
                },"calendar_event_reminders": {
                  Row: {
                    "event_id": string,"id": string,"minutes_before": number,"remind_at": string,"sent_at": string | null,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"id"?: string,"minutes_before": number,"remind_at": string,"sent_at"?: string | null,"space_id": string,"user_id"?: string
                  }
                  Update: {
                    "event_id"?: string,"id"?: string,"minutes_before"?: number,"remind_at"?: string,"sent_at"?: string | null,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_event_reminders_space_id_event_id_fkey"
      columns: ["space_id","event_id"]
isOneToOne: false
      referencedRelation: "calendar_events"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "calendar_event_reminders_space_id_user_id_fkey"
      columns: ["space_id","user_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    }
                  ]
                },"calendar_events": {
                  Row: {
                    "all_day": boolean,"created_at": string,"created_by": string | null,"default_reminders": (number)[],"description": string,"end_date": string | null,"ends_at": string | null,"id": string,"idea_id": string | null,"location": string,"repeats_yearly": boolean,"space_id": string,"start_date": string | null,"starts_at": string | null,"task_id": string | null,"time_zone": string,"title": string,"updated_at": string,"watch_item_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "all_day"?: boolean,"created_at"?: string,"created_by"?: string | null,"default_reminders"?: (number)[],"description"?: string,"end_date"?: string | null,"ends_at"?: string | null,"id"?: string,"idea_id"?: string | null,"location"?: string,"repeats_yearly"?: boolean,"space_id": string,"start_date"?: string | null,"starts_at"?: string | null,"task_id"?: string | null,"time_zone": string,"title": string,"updated_at"?: string,"watch_item_id"?: string | null
                  }
                  Update: {
                    "all_day"?: boolean,"created_at"?: string,"created_by"?: string | null,"default_reminders"?: (number)[],"description"?: string,"end_date"?: string | null,"ends_at"?: string | null,"id"?: string,"idea_id"?: string | null,"location"?: string,"repeats_yearly"?: boolean,"space_id"?: string,"start_date"?: string | null,"starts_at"?: string | null,"task_id"?: string | null,"time_zone"?: string,"title"?: string,"updated_at"?: string,"watch_item_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_events_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_events_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "calendar_events_space_id_task_id_fkey"
      columns: ["space_id","task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "calendar_events_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"catalog_cache": {
                  Row: {
                    "cache_key": string,"expires_at": string,"fetched_at": string,"response": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "cache_key": string,"expires_at": string,"fetched_at"?: string,"response": NonNullable<Json>
                  }
                  Update: {
                    "cache_key"?: string,"expires_at"?: string,"fetched_at"?: string,"response"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"comment_mentions": {
                  Row: {
                    "comment_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id": string,"user_id": string
                  }
                  Update: {
                    "comment_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comment_mentions_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comment_mentions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"edited": boolean,"id": string,"idea_id": string | null,"space_id": string,"spoiler": boolean,"updated_at": string,"watch_item_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"edited"?: boolean,"id"?: string,"idea_id"?: string | null,"space_id": string,"spoiler"?: boolean,"updated_at"?: string,"watch_item_id"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"edited"?: boolean,"id"?: string,"idea_id"?: string | null,"space_id"?: string,"spoiler"?: boolean,"updated_at"?: string,"watch_item_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_idea_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "comments_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_watch_item_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"episode_watches": {
                  Row: {
                    "episode": number | null,"id": string,"party_id": string | null,"season": number | null,"source": string,"space_id": string,"user_id": string,"watch_item_id": string,"watched_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "episode"?: number | null,"id"?: string,"party_id"?: string | null,"season"?: number | null,"source": string,"space_id": string,"user_id": string,"watch_item_id": string,"watched_at"?: string
                  }
                  Update: {
                    "episode"?: number | null,"id"?: string,"party_id"?: string | null,"season"?: number | null,"source"?: string,"space_id"?: string,"user_id"?: string,"watch_item_id"?: string,"watched_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "episode_watches_party_fkey"
      columns: ["party_id"]
isOneToOne: false
      referencedRelation: "watch_parties"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "episode_watches_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "episode_watches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"hypotheses": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"idea_id": string,"space_id": string,"statement": string,"status": Database["public"]['Enums']["hypothesis_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id": string,"space_id": string,"statement": string,"status"?: Database["public"]['Enums']["hypothesis_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id"?: string,"space_id"?: string,"statement"?: string,"status"?: Database["public"]['Enums']["hypothesis_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hypotheses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hypotheses_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"idea_collaborators": {
                  Row: {
                    "accepted_at": string | null,"idea_id": string,"invited_at": string,"invited_by": string | null,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"idea_id": string,"invited_at"?: string,"invited_by"?: string | null,"space_id": string,"user_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"idea_id"?: string,"invited_at"?: string,"invited_by"?: string | null,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "idea_collaborators_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "idea_collaborators_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "idea_collaborators_space_id_user_id_fkey"
      columns: ["space_id","user_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    }
                  ]
                },"idea_notes": {
                  Row: {
                    "body": string,"created_at": string,"created_by": string | null,"id": string,"idea_id": string,"space_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id": string,"space_id": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id"?: string,"space_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "idea_notes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "idea_notes_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"ideas": {
                  Row: {
                    "brief": NonNullable<Json>,"created_at": string,"created_by": string | null,"currency": string,"id": string,"space_id": string,"stage": Database["public"]['Enums']["idea_stage"],"tags": (string)[],"template": Database["public"]['Enums']["idea_template"],"title": string,"updated_at": string,"ours": boolean | null
                  }
                  ComputedFields: "ours"
                  Insert: {
                    "brief"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"space_id": string,"stage"?: Database["public"]['Enums']["idea_stage"],"tags"?: (string)[],"template"?: Database["public"]['Enums']["idea_template"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "brief"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"space_id"?: string,"stage"?: Database["public"]['Enums']["idea_stage"],"tags"?: (string)[],"template"?: Database["public"]['Enums']["idea_template"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ideas_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ideas_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"milestones": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"created_by": string | null,"id": string,"idea_id": string,"space_id": string,"target_date": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id": string,"space_id": string,"target_date"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idea_id"?: string,"space_id"?: string,"target_date"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"deduplication_key": string,"id": string,"read_at": string | null,"recipient_id": string,"space_id": string,"subject_id": string,"subject_type": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"deduplication_key": string,"id"?: string,"read_at"?: string | null,"recipient_id": string,"space_id": string,"subject_id": string,"subject_type": string,"type": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"deduplication_key"?: string,"id"?: string,"read_at"?: string | null,"recipient_id"?: string,"space_id"?: string,"subject_id"?: string,"subject_type"?: string,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_devices": {
                  Row: {
                    "created_at": string,"id": string,"last_seen_at": string,"platform": string,"token": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_seen_at"?: string,"platform": string,"token": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_seen_at"?: string,"platform"?: string,"token"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_devices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "bucket": string,"count": number,"user_id": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": string,"count"?: number,"user_id": string,"window_start"?: string
                  }
                  Update: {
                    "bucket"?: string,"count"?: number,"user_id"?: string,"window_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rate_limits_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"recommendations": {
                  Row: {
                    "created_at": string,"id": string,"note": string | null,"recipient_id": string,"responded_at": string | null,"sender_id": string | null,"space_id": string,"status": string,"watch_item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"recipient_id": string,"responded_at"?: string | null,"sender_id"?: string | null,"space_id": string,"status"?: string,"watch_item_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"recipient_id"?: string,"responded_at"?: string | null,"sender_id"?: string | null,"space_id"?: string,"status"?: string,"watch_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recommendations_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendations_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendations_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendations_watch_item_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"research_links": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": string,"id": string,"idea_id": string,"space_id": string,"title": string,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"idea_id": string,"space_id": string,"title": string,"updated_at"?: string,"url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: string,"id"?: string,"idea_id"?: string,"space_id"?: string,"title"?: string,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "research_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "research_links_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"space_invites": {
                  Row: {
                    "created_at": string,"created_by": string | null,"expires_at": string,"id": string,"redeemed_at": string | null,"redeemed_by": string | null,"revoked_at": string | null,"space_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"id"?: string,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"revoked_at"?: string | null,"space_id": string,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"id"?: string,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"revoked_at"?: string | null,"space_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_invites_redeemed_by_fkey"
      columns: ["redeemed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_invites_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"space_members": {
                  Row: {
                    "joined_at": string,"role": Database["public"]['Enums']["space_role"],"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"role"?: Database["public"]['Enums']["space_role"],"space_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"role"?: Database["public"]['Enums']["space_role"],"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_members_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"space_note_drafts": {
                  Row: {
                    "author_id": string,"created_at": string,"id": string,"recipient_id": string | null,"response_wish": Database["public"]['Enums']["note_response_wish"],"sections": NonNullable<Json>,"space_id": string,"support_wish": Database["public"]['Enums']["note_support_wish"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string,"created_at"?: string,"id"?: string,"recipient_id"?: string | null,"response_wish"?: Database["public"]['Enums']["note_response_wish"],"sections"?: NonNullable<Json>,"space_id": string,"support_wish"?: Database["public"]['Enums']["note_support_wish"] | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"created_at"?: string,"id"?: string,"recipient_id"?: string | null,"response_wish"?: Database["public"]['Enums']["note_response_wish"],"sections"?: NonNullable<Json>,"space_id"?: string,"support_wish"?: Database["public"]['Enums']["note_support_wish"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_note_drafts_space_id_author_id_fkey"
      columns: ["space_id","author_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    },{
      foreignKeyName: "space_note_drafts_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_note_drafts_space_id_recipient_id_fkey"
      columns: ["space_id","recipient_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    }
                  ]
                },"space_note_nudges": {
                  Row: {
                    "created_at": string,"id": string,"note_id": string,"remind_at": string,"sent_at": string | null,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"note_id": string,"remind_at": string,"sent_at"?: string | null,"space_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"note_id"?: string,"remind_at"?: string,"sent_at"?: string | null,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_note_nudges_space_id_note_id_fkey"
      columns: ["space_id","note_id"]
isOneToOne: false
      referencedRelation: "space_notes"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "space_note_nudges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"space_note_reads": {
                  Row: {
                    "note_id": string,"read_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "note_id": string,"read_at"?: string,"user_id": string
                  }
                  Update: {
                    "note_id"?: string,"read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_note_reads_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "space_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_note_reads_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"space_note_replies": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"note_id": string,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"note_id": string,"space_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"note_id"?: string,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_note_replies_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_note_replies_space_id_note_id_fkey"
      columns: ["space_id","note_id"]
isOneToOne: false
      referencedRelation: "space_notes"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"space_note_responses": {
                  Row: {
                    "author_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["note_response_kind"],"note_id": string,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["note_response_kind"],"note_id": string,"space_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["note_response_kind"],"note_id"?: string,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_note_responses_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_note_responses_space_id_note_id_fkey"
      columns: ["space_id","note_id"]
isOneToOne: false
      referencedRelation: "space_notes"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"space_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"expires_at": string | null,"id": string,"kind": Database["public"]['Enums']["note_kind"],"pinned": boolean,"recipient_id": string | null,"response_wish": Database["public"]['Enums']["note_response_wish"] | null,"sections": Json | null,"space_id": string,"support_wish": Database["public"]['Enums']["note_support_wish"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["note_kind"],"pinned"?: boolean,"recipient_id"?: string | null,"response_wish"?: Database["public"]['Enums']["note_response_wish"] | null,"sections"?: Json | null,"space_id": string,"support_wish"?: Database["public"]['Enums']["note_support_wish"] | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["note_kind"],"pinned"?: boolean,"recipient_id"?: string | null,"response_wish"?: Database["public"]['Enums']["note_response_wish"] | null,"sections"?: Json | null,"space_id"?: string,"support_wish"?: Database["public"]['Enums']["note_support_wish"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_notes_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "space_notes_space_id_recipient_id_fkey"
      columns: ["space_id","recipient_id"]
isOneToOne: false
      referencedRelation: "space_members"
      referencedColumns: ["space_id","user_id"]
    }
                  ]
                },"spaces": {
                  Row: {
                    "accent_color": string | null,"avatar_path": string | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"default_watch_intent": Database["public"]['Enums']["watch_intent"],"description": string,"home_cards": (string)[],"icon": string | null,"id": string,"name": string,"tagline": string,"template": Database["public"]['Enums']["space_template"],"theme": Database["public"]['Enums']["space_theme"] | null,"updated_at": string,"week_starts_on": number
                  }
                  ComputedFields: never
                  Insert: {
                    "accent_color"?: string | null,"avatar_path"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_watch_intent"?: Database["public"]['Enums']["watch_intent"],"description"?: string,"home_cards"?: (string)[],"icon"?: string | null,"id"?: string,"name": string,"tagline"?: string,"template"?: Database["public"]['Enums']["space_template"],"theme"?: Database["public"]['Enums']["space_theme"] | null,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Update: {
                    "accent_color"?: string | null,"avatar_path"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_watch_intent"?: Database["public"]['Enums']["watch_intent"],"description"?: string,"home_cards"?: (string)[],"icon"?: string | null,"id"?: string,"name"?: string,"tagline"?: string,"template"?: Database["public"]['Enums']["space_template"],"theme"?: Database["public"]['Enums']["space_theme"] | null,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "spaces_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"task_checklist_items": {
                  Row: {
                    "created_at": string,"created_by": string | null,"done": boolean,"id": string,"label": string,"position": number,"space_id": string,"task_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"done"?: boolean,"id"?: string,"label": string,"position"?: number,"space_id": string,"task_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"done"?: boolean,"id"?: string,"label"?: string,"position"?: number,"space_id"?: string,"task_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_checklist_items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_checklist_items_space_id_task_id_fkey"
      columns: ["space_id","task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"created_at": string,"created_by": string | null,"description": string,"due_date": string | null,"id": string,"idea_id": string,"milestone_id": string | null,"priority": Database["public"]['Enums']["task_priority"],"space_id": string,"status": Database["public"]['Enums']["task_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date"?: string | null,"id"?: string,"idea_id": string,"milestone_id"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"space_id": string,"status"?: Database["public"]['Enums']["task_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date"?: string | null,"id"?: string,"idea_id"?: string,"milestone_id"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"space_id"?: string,"status"?: Database["public"]['Enums']["task_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_idea_id_milestone_id_fkey"
      columns: ["idea_id","milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["idea_id","id"]
    },{
      foreignKeyName: "tasks_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"together_progress": {
                  Row: {
                    "episode": number | null,"season": number | null,"space_id": string,"updated_at": string,"watch_item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "episode"?: number | null,"season"?: number | null,"space_id": string,"updated_at"?: string,"watch_item_id": string
                  }
                  Update: {
                    "episode"?: number | null,"season"?: number | null,"space_id"?: string,"updated_at"?: string,"watch_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "together_progress_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"watch_items": {
                  Row: {
                    "catalog_id": number | null,"catalog_type": Database["public"]['Enums']["watch_catalog_type"] | null,"created_at": string,"created_by": string | null,"id": string,"manual_availability_note": string | null,"media_type": Database["public"]['Enums']["watch_media_type"],"poster_path": string | null,"release_year": number | null,"shared_intent": Database["public"]['Enums']["watch_intent"],"sort_key": string | null,"space_id": string,"synopsis": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_id"?: number | null,"catalog_type"?: Database["public"]['Enums']["watch_catalog_type"] | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"manual_availability_note"?: string | null,"media_type": Database["public"]['Enums']["watch_media_type"],"poster_path"?: string | null,"release_year"?: number | null,"shared_intent"?: Database["public"]['Enums']["watch_intent"],"sort_key"?: never,"space_id": string,"synopsis"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "catalog_id"?: number | null,"catalog_type"?: Database["public"]['Enums']["watch_catalog_type"] | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"manual_availability_note"?: string | null,"media_type"?: Database["public"]['Enums']["watch_media_type"],"poster_path"?: string | null,"release_year"?: number | null,"shared_intent"?: Database["public"]['Enums']["watch_intent"],"sort_key"?: never,"space_id"?: string,"synopsis"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "watch_items_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"watch_parties": {
                  Row: {
                    "created_at": string,"ended_at": string | null,"from_episode": number | null,"from_season": number | null,"host_id": string | null,"id": string,"season_episode_counts": (number)[] | null,"source": Database["public"]['Enums']["party_source"],"space_id": string,"started_at": string | null,"status": Database["public"]['Enums']["party_status"],"to_episode": number | null,"to_season": number | null,"watch_item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ended_at"?: string | null,"from_episode"?: number | null,"from_season"?: number | null,"host_id"?: string | null,"id"?: string,"season_episode_counts"?: (number)[] | null,"source": Database["public"]['Enums']["party_source"],"space_id": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["party_status"],"to_episode"?: number | null,"to_season"?: number | null,"watch_item_id": string
                  }
                  Update: {
                    "created_at"?: string,"ended_at"?: string | null,"from_episode"?: number | null,"from_season"?: number | null,"host_id"?: string | null,"id"?: string,"season_episode_counts"?: (number)[] | null,"source"?: Database["public"]['Enums']["party_source"],"space_id"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["party_status"],"to_episode"?: number | null,"to_season"?: number | null,"watch_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_parties_host_id_fkey"
      columns: ["host_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "watch_parties_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                },"watch_party_members": {
                  Row: {
                    "confirmed": boolean,"joined_at": string,"party_id": string,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed"?: boolean,"joined_at"?: string,"party_id": string,"space_id": string,"user_id": string
                  }
                  Update: {
                    "confirmed"?: boolean,"joined_at"?: string,"party_id"?: string,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_party_members_space_id_party_id_fkey"
      columns: ["space_id","party_id"]
isOneToOne: false
      referencedRelation: "watch_parties"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "watch_party_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"watch_progress": {
                  Row: {
                    "completed_on": string | null,"episode": number | null,"rating": number | null,"season": number | null,"space_id": string,"status": Database["public"]['Enums']["watch_status"],"updated_at": string,"user_id": string,"watch_item_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_on"?: string | null,"episode"?: number | null,"rating"?: number | null,"season"?: number | null,"space_id": string,"status"?: Database["public"]['Enums']["watch_status"],"updated_at"?: string,"user_id"?: string,"watch_item_id": string
                  }
                  Update: {
                    "completed_on"?: string | null,"episode"?: number | null,"rating"?: number | null,"season"?: number | null,"space_id"?: string,"status"?: Database["public"]['Enums']["watch_status"],"updated_at"?: string,"user_id"?: string,"watch_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_progress_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "watch_progress_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"watch_session_members": {
                  Row: {
                    "session_id": string,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "session_id": string,"space_id": string,"user_id": string
                  }
                  Update: {
                    "session_id"?: string,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_session_members_space_id_session_id_fkey"
      columns: ["space_id","session_id"]
isOneToOne: false
      referencedRelation: "watch_sessions"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "watch_session_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"watch_sessions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"note": string | null,"space_id": string,"watch_item_id": string,"watched_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"space_id": string,"watch_item_id": string,"watched_on"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"note"?: string | null,"space_id"?: string,"watch_item_id"?: string,"watched_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "watch_sessions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "watch_sessions_space_id_watch_item_id_fkey"
      columns: ["space_id","watch_item_id"]
isOneToOne: false
      referencedRelation: "watch_items"
      referencedColumns: ["space_id","id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_catalog_title":
{ Args: { "intent": Database["public"]['Enums']["watch_intent"],"kind": Database["public"]['Enums']["watch_catalog_type"],"media": Database["public"]['Enums']["watch_media_type"],"poster_path": string,"release_year": number,"synopsis": string,"target_space": string,"title": string,"tmdb_id": number }; Returns: string
                           },
"add_default_reminders":
{ Args: { "event": string,"member": string }; Returns: undefined
                           },
"after_member_left":
{ Args: { "member": string,"target_space": string }; Returns: undefined
                           },
"by_me":
{ Args: { "": Database["public"]['Tables']["activity_events"]['Row'] }; Returns: { error: true } & "the function public.by_me with parameter or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache"
                           },
"can_read_attachment_object":
{ Args: { "path": string }; Returns: boolean
                           },
"cancel_party":
{ Args: { "party": string }; Returns: undefined
                           },
"change_idea_currency":
{ Args: { "clear_entries": boolean,"idea": string,"new_currency": string }; Returns: undefined
                           },
"check_party_range":
{ Args: { "counts": (number)[],"e1": number,"e2": number,"media": Database["public"]['Enums']["watch_media_type"],"s1": number,"s2": number }; Returns: undefined
                           },
"cleanup_candidates":
{ Args: Record<PropertyKey, never>; Returns: {
              "attachment_id": string,"object_path": string
            }[]
                           },
"configure_push":
{ Args: { "function_url": string,"secret": string }; Returns: undefined
                           },
"confirm_party":
{ Args: { "party": string }; Returns: undefined
                           },
"consume_rate_limit":
{ Args: { "bucket_name": string,"max_requests": number,"target_user": string,"window_seconds": number }; Returns: boolean
                           },
"create_invite":
{ Args: { "target_space": string }; Returns: string
                           },
"create_space":
{ Args: { "space_name": string,"space_template": Database["public"]['Enums']["space_template"] }; Returns: string
                           },
"delete_attachment":
{ Args: { "target": string }; Returns: string
                           },
"delete_comment":
{ Args: { "target": string }; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"delete_space":
{ Args: { "confirm_name": string,"target_space": string }; Returns: undefined
                           },
"deliver_event_reminders":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"deliver_note_nudges":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"edit_comment":
{ Args: { "new_body": string,"new_spoiler": boolean,"target": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"edited": boolean,
"id": string,
"idea_id": string | null,
"space_id": string,
"spoiler": boolean,
"updated_at": string,
"watch_item_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "comments"
        isOneToOne: true
        isSetofReturn: false
      } },
"expire_watch_parties":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"export_me":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"export_space":
{ Args: { "target_space": string }; Returns: Json
                           },
"export_table_filter":
{ Args: { "tbl": string }; Returns: string
                           },
"export_table_names":
{ Args: Record<PropertyKey, never>; Returns: (string)[]
                           },
"export_table_rows":
{ Args: { "target_space": string,"tbl": string }; Returns: Json
                           },
"finish_party":
{ Args: { "party": string }; Returns: undefined
                           },
"handover_party":
{ Args: { "party": string }; Returns: undefined
                           },
"has_column":
{ Args: { "col": string,"tbl": string }; Returns: boolean
                           },
"hash_invite_token":
{ Args: { "token": string }; Returns: string
                           },
"idea_participants":
{ Args: { "target_idea": string }; Returns: string[]
                           },
"invite_idea_collaborator":
{ Args: { "idea": string,"member": string }; Returns: undefined
                           },
"invite_preview":
{ Args: { "token": string }; Returns: {
              "inviter_name": string,"space_name": string,"status": string
            }[]
                           },
"is_iana_time_zone":
{ Args: { "zone": string }; Returns: boolean
                           },
"is_member_of":
{ Args: { "target_space": string,"target_user": string }; Returns: boolean
                           },
"is_party_topic_member":
{ Args: { "topic": string }; Returns: boolean
                           },
"is_space_member":
{ Args: { "target_space": string }; Returns: boolean
                           },
"is_space_owner":
{ Args: { "target_space": string }; Returns: boolean
                           },
"is_valid_home_cards":
{ Args: { "cards": (string)[] }; Returns: boolean
                           },
"is_valid_idea_brief":
{ Args: { "brief": Json }; Returns: boolean
                           },
"is_valid_note_sections":
{ Args: { "allow_empty": boolean,"sections": Json }; Returns: boolean
                           },
"join_party":
{ Args: { "party": string }; Returns: undefined
                           },
"leave_space":
{ Args: { "target_space": string }; Returns: undefined
                           },
"list_calendar":
{ Args: { "from_date": string,"target_space": string,"to_date": string,"tz": string }; Returns: {
              "all_day": boolean,"end_date": string,"ends_at": string,"id": string,"idea_id": string,"kind": string,"my_rsvp": Database["public"]['Enums']["event_rsvp"],"start_date": string,"starts_at": string,"status": string,"title": string
            }[]
                           },
"list_watch_items":
{ Args: { "after_id"?: string,"after_key"?: string,"intent"?: Database["public"]['Enums']["watch_intent"],"media"?: Database["public"]['Enums']["watch_media_type"],"my_status"?: string,"page_size"?: number,"search"?: string,"sort_by"?: string,"target_space": string }; Returns: {
              "catalog_id": number,"catalog_type": Database["public"]['Enums']["watch_catalog_type"],"created_at": string,"created_by": string,"id": string,"manual_availability_note": string,"media_type": Database["public"]['Enums']["watch_media_type"],"my_progress": string,"poster_path": string,"release_year": number,"shared_intent": Database["public"]['Enums']["watch_intent"],"sort_key": string,"space_id": string,"synopsis": string,"title": string,"updated_at": string
            }[]
                           },
"log_watch_session":
{ Args: { "item": string,"member_ids": (string)[],"note"?: string,"watched_on": string }; Returns: string
                           },
"mark_episode_watched":
{ Args: { "item": string,"origin": string,"watched_episode": number,"watched_season": number }; Returns: undefined
                           },
"mark_note_read":
{ Args: { "note": string }; Returns: undefined
                           },
"next_remind_at":
{ Args: { "after": string,"event": string,"minutes": number }; Returns: string
                           },
"notify":
{ Args: { "dedup": string,"kind": string,"recipient": string,"subject": string,"subject_kind": string,"target_space": string }; Returns: undefined
                           },
"open_party":
{ Args: { "party": string }; Returns: {
              "created_at": string,
"ended_at": string | null,
"from_episode": number | null,
"from_season": number | null,
"host_id": string | null,
"id": string,
"season_episode_counts": (number)[] | null,
"source": Database["public"]['Enums']["party_source"],
"space_id": string,
"started_at": string | null,
"status": Database["public"]['Enums']["party_status"],
"to_episode": number | null,
"to_season": number | null,
"watch_item_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "watch_parties"
        isOneToOne: true
        isSetofReturn: false
      } },
"ours":
{ Args: { "": Database["public"]['Tables']["ideas"]['Row'] }; Returns: { error: true } & "the function public.ours with parameter or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache"
                           },
"party_episodes":
{ Args: { "counts": (number)[],"e1": number,"e2": number,"s1": number,"s2": number }; Returns: {
              "episode": number,"season": number
            }[]
                           },
"party_for_member":
{ Args: { "party": string }; Returns: {
              "created_at": string,
"ended_at": string | null,
"from_episode": number | null,
"from_season": number | null,
"host_id": string | null,
"id": string,
"season_episode_counts": (number)[] | null,
"source": Database["public"]['Enums']["party_source"],
"space_id": string,
"started_at": string | null,
"status": Database["public"]['Enums']["party_status"],
"to_episode": number | null,
"to_season": number | null,
"watch_item_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "watch_parties"
        isOneToOne: true
        isSetofReturn: false
      } },
"post_comment":
{ Args: { "body": string,"mention_ids": (string)[],"parent_id": string,"parent_kind": string,"spoiler": boolean,"target_space": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"edited": boolean,
"id": string,
"idea_id": string | null,
"space_id": string,
"spoiler": boolean,
"updated_at": string,
"watch_item_id": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "comments"
        isOneToOne: true
        isSetofReturn: false
      } },
"post_note":
{ Args: { "body": string,"expires_at": string,"pinned": boolean,"recipient": string,"target_space": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"expires_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["note_kind"],
"pinned": boolean,
"recipient_id": string | null,
"response_wish": Database["public"]['Enums']["note_response_wish"] | null,
"sections": Json | null,
"space_id": string,
"support_wish": Database["public"]['Enums']["note_support_wish"] | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "space_notes"
        isOneToOne: true
        isSetofReturn: false
      } },
"push_targets":
{ Args: { "target_notification": string }; Returns: {
              "actor_name": string,"space_id": string,"subject_id": string,"subject_type": string,"token": string,"type": string
            }[]
                           },
"recommend":
{ Args: { "item": string,"note": string,"recipient_ids": (string)[] }; Returns: (string)[]
                           },
"record_activity":
{ Args: { "kind": string,"subject": string,"subject_kind": string,"target_space": string }; Returns: undefined
                           },
"record_private_activity":
{ Args: { "kind": string,"subject": string,"subject_kind": string,"target": string,"target_space": string }; Returns: undefined
                           },
"redeem_invite":
{ Args: { "token": string }; Returns: string
                           },
"register_push_device":
{ Args: { "platform": string,"token": string }; Returns: undefined
                           },
"remove_idea_collaborator":
{ Args: { "idea": string,"member": string }; Returns: undefined
                           },
"remove_member":
{ Args: { "member": string,"target_space": string }; Returns: undefined
                           },
"reply_to_note":
{ Args: { "body": string,"note": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"id": string,
"note_id": string,
"space_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "space_note_replies"
        isOneToOne: true
        isSetofReturn: false
      } },
"require_recent_sign_in":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"respond_idea_invite":
{ Args: { "accept": boolean,"idea": string }; Returns: undefined
                           },
"respond_recommendation":
{ Args: { "response": string,"target": string }; Returns: undefined
                           },
"respond_to_note":
{ Args: { "kind": Database["public"]['Enums']["note_response_kind"],"note": string,"remind_in_days": number }; Returns: {
              "author_id": string | null,
"created_at": string,
"id": string,
"kind": Database["public"]['Enums']["note_response_kind"],
"note_id": string,
"space_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "space_note_responses"
        isOneToOne: true
        isSetofReturn: false
      } },
"revoke_invite":
{ Args: { "invite": string }; Returns: undefined
                           },
"rsvp_event":
{ Args: { "event": string,"response": Database["public"]['Enums']["event_rsvp"] }; Returns: undefined
                           },
"save_watch_progress":
{ Args: { "item": string,"new_completed_on": string,"new_episode": number,"new_rating": number,"new_season": number,"new_status": Database["public"]['Enums']["watch_status"] }; Returns: undefined
                           },
"send_note_draft":
{ Args: { "draft": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"expires_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["note_kind"],
"pinned": boolean,
"recipient_id": string | null,
"response_wish": Database["public"]['Enums']["note_response_wish"] | null,
"sections": Json | null,
"space_id": string,
"support_wish": Database["public"]['Enums']["note_support_wish"] | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "space_notes"
        isOneToOne: true
        isSetofReturn: false
      } },
"set_event_attendees":
{ Args: { "event": string,"members": (string)[] }; Returns: undefined
                           },
"set_my_event_reminders":
{ Args: { "event": string,"minutes": (number)[] }; Returns: undefined
                           },
"set_space_media":
{ Args: { "object_path": string,"slot": string,"target_space": string }; Returns: string
                           },
"shares_space_with":
{ Args: { "other_user": string }; Returns: boolean
                           },
"space_media_cleanup_candidates":
{ Args: Record<PropertyKey, never>; Returns: {
              "object_path": string
            }[]
                           },
"space_media_quota_ok":
{ Args: { "target_space": string }; Returns: boolean
                           },
"space_media_space":
{ Args: { "path": string }; Returns: string
                           },
"start_party":
{ Args: { "counts"?: (number)[],"e1": number,"e2": number,"item": string,"s1": number,"s2": number,"src": string }; Returns: string
                           },
"transfer_ownership":
{ Args: { "new_owner": string,"target_space": string }; Returns: undefined
                           },
"unregister_push_device":
{ Args: { "token": string }; Returns: undefined
                           },
"update_idea_brief":
{ Args: { "brief": Json,"expected_updated_at": string,"idea": string }; Returns: string
                           },
"visible_note":
{ Args: { "note": string }; Returns: {
              "author_id": string | null,
"body": string,
"created_at": string,
"expires_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["note_kind"],
"pinned": boolean,
"recipient_id": string | null,
"response_wish": Database["public"]['Enums']["note_response_wish"] | null,
"sections": Json | null,
"space_id": string,
"support_wish": Database["public"]['Enums']["note_support_wish"] | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "space_notes"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "attachment_status": "pending"|"ready"|"rejected","event_rsvp": "pending"|"going"|"maybe"|"declined","hypothesis_status": "untested"|"validated"|"invalidated","idea_stage": "inbox"|"exploring"|"planning"|"building"|"launched"|"paused"|"archived","idea_template": "blank"|"business"|"creative","note_kind": "note"|"hard_talk","note_response_kind": "here"|"time"|"talk"|"thanks","note_response_wish": "talk"|"write"|"read"|"any","note_support_wish": "listen"|"solve","party_source": "jellyfin"|"external","party_status": "planned"|"live"|"ended"|"cancelled","space_role": "owner"|"member","space_template": "couple"|"friends"|"family"|"blank","space_theme": "blank"|"couple"|"friends"|"family"|"ocean"|"meadow"|"dusk"|"berry","task_priority": "low"|"medium"|"high"|"urgent","task_status": "backlog"|"todo"|"in_progress"|"done","watch_catalog_type": "movie"|"tv","watch_intent": "want_to_watch"|"watch_together"|"archived","watch_media_type": "movie"|"series"|"anime","watch_status": "not_started"|"watching"|"completed"|"dropped"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "attachment_status": ["pending", "ready", "rejected"],"event_rsvp": ["pending", "going", "maybe", "declined"],"hypothesis_status": ["untested", "validated", "invalidated"],"idea_stage": ["inbox", "exploring", "planning", "building", "launched", "paused", "archived"],"idea_template": ["blank", "business", "creative"],"note_kind": ["note", "hard_talk"],"note_response_kind": ["here", "time", "talk", "thanks"],"note_response_wish": ["talk", "write", "read", "any"],"note_support_wish": ["listen", "solve"],"party_source": ["jellyfin", "external"],"party_status": ["planned", "live", "ended", "cancelled"],"space_role": ["owner", "member"],"space_template": ["couple", "friends", "family", "blank"],"space_theme": ["blank", "couple", "friends", "family", "ocean", "meadow", "dusk", "berry"],"task_priority": ["low", "medium", "high", "urgent"],"task_status": ["backlog", "todo", "in_progress", "done"],"watch_catalog_type": ["movie", "tv"],"watch_intent": ["want_to_watch", "watch_together", "archived"],"watch_media_type": ["movie", "series", "anime"],"watch_status": ["not_started", "watching", "completed", "dropped"]
          }
        }
} as const
