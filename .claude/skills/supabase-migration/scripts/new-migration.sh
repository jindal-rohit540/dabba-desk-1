#!/usr/bin/env bash
# Usage: new-migration.sh add_pause_columns  → supabase/migrations/20261023101500_add_pause_columns.sql
set -euo pipefail
name="${1:?usage: new-migration.sh <snake_case_name>}"
[[ "$name" =~ ^[a-z0-9_]+$ ]] || { echo "name must be snake_case" >&2; exit 1; }
file="supabase/migrations/$(date -u +%Y%m%d%H%M%S)_${name}.sql"
printf -- "-- %s\n-- Created %s. Never edit after it has been applied; add a new migration instead.\n\n" "$name" "$(date -u +%FT%TZ)" > "$file"
echo "$file"
