
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activity_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"event_type": string,"id": string,"space_id": string,"subject_id": string,"subject_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type": string,"id"?: string,"space_id": string,"subject_id": string,"subject_type": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"event_type"?: string,"id"?: string,"space_id"?: string,"subject_id"?: string,"subject_type"?: string
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
                    "brief": NonNullable<Json>,"created_at": string,"created_by": string | null,"currency": string,"id": string,"space_id": string,"stage": Database["public"]['Enums']["idea_stage"],"tags": (string)[],"template": Database["public"]['Enums']["idea_template"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
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
                },"spaces": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"name": string,"template": Database["public"]['Enums']["space_template"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"template"?: Database["public"]['Enums']["space_template"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"template"?: Database["public"]['Enums']["space_template"],"updated_at"?: string
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
                    "created_at": string,"done": boolean,"id": string,"label": string,"position": number,"space_id": string,"task_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"done"?: boolean,"id"?: string,"label": string,"position"?: number,"space_id": string,"task_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"done"?: boolean,"id"?: string,"label"?: string,"position"?: number,"space_id"?: string,"task_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
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
      foreignKeyName: "tasks_space_id_idea_id_fkey"
      columns: ["space_id","idea_id"]
isOneToOne: false
      referencedRelation: "ideas"
      referencedColumns: ["space_id","id"]
    },{
      foreignKeyName: "tasks_space_id_milestone_id_fkey"
      columns: ["space_id","milestone_id"]
isOneToOne: false
      referencedRelation: "milestones"
      referencedColumns: ["space_id","id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "after_member_left":
{ Args: { "member": string,"target_space": string }; Returns: undefined
                           },
"change_idea_currency":
{ Args: { "clear_entries": boolean,"idea": string,"new_currency": string }; Returns: undefined
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
"delete_space":
{ Args: { "confirm_name": string,"target_space": string }; Returns: undefined
                           },
"hash_invite_token":
{ Args: { "token": string }; Returns: string
                           },
"invite_preview":
{ Args: { "token": string }; Returns: {
              "inviter_name": string,"space_name": string,"status": string
            }[]
                           },
"is_member_of":
{ Args: { "target_space": string,"target_user": string }; Returns: boolean
                           },
"is_space_member":
{ Args: { "target_space": string }; Returns: boolean
                           },
"is_space_owner":
{ Args: { "target_space": string }; Returns: boolean
                           },
"is_valid_idea_brief":
{ Args: { "brief": Json }; Returns: boolean
                           },
"leave_space":
{ Args: { "target_space": string }; Returns: undefined
                           },
"notify":
{ Args: { "dedup": string,"kind": string,"recipient": string,"subject": string,"subject_kind": string,"target_space": string }; Returns: undefined
                           },
"record_activity":
{ Args: { "kind": string,"subject": string,"subject_kind": string,"target_space": string }; Returns: undefined
                           },
"redeem_invite":
{ Args: { "token": string }; Returns: string
                           },
"remove_member":
{ Args: { "member": string,"target_space": string }; Returns: undefined
                           },
"revoke_invite":
{ Args: { "invite": string }; Returns: undefined
                           },
"shares_space_with":
{ Args: { "other_user": string }; Returns: boolean
                           },
"transfer_ownership":
{ Args: { "new_owner": string,"target_space": string }; Returns: undefined
                           },
"update_idea_brief":
{ Args: { "brief": Json,"expected_updated_at": string,"idea": string }; Returns: string
                           }
          }
          Enums: {
            "hypothesis_status": "untested"|"validated"|"invalidated","idea_stage": "inbox"|"exploring"|"planning"|"building"|"launched"|"paused"|"archived","idea_template": "blank"|"business"|"creative","space_role": "owner"|"member","space_template": "couple"|"friends"|"family"|"blank","task_priority": "low"|"medium"|"high"|"urgent","task_status": "backlog"|"todo"|"in_progress"|"done"
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
            "hypothesis_status": ["untested", "validated", "invalidated"],"idea_stage": ["inbox", "exploring", "planning", "building", "launched", "paused", "archived"],"idea_template": ["blank", "business", "creative"],"space_role": ["owner", "member"],"space_template": ["couple", "friends", "family", "blank"],"task_priority": ["low", "medium", "high", "urgent"],"task_status": ["backlog", "todo", "in_progress", "done"]
          }
        }
} as const
