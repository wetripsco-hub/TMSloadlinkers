-- 007_workspace_type_domain_alignment.sql
-- Replace tenant_workspace_type with the business-mode vocabulary used by
-- the Organization domain interface (types/domain.ts WorkspaceType), so
-- useWorkspaceMode() can read organizations.workspace_type directly without
-- a lossy runtime mapping.

alter table organizations alter column workspace_type drop default;

create type tenant_workspace_type_new as enum (
  'freight_brokerage',
  'truck_dispatch',
  'hybrid_enterprise'
);

-- Existing rows: broker -> freight_brokerage and carrier -> truck_dispatch
-- map directly. 'shipper' and 'admin' have no equivalent business mode in
-- the new vocabulary (a shipper is a counterparty, not a brokerage/dispatch
-- operator); they default to hybrid_enterprise, the most permissive mode,
-- so no financial field a pre-existing org could see becomes hidden.
alter table organizations
  alter column workspace_type type tenant_workspace_type_new
  using (
    case workspace_type::text
      when 'broker' then 'freight_brokerage'
      when 'carrier' then 'truck_dispatch'
      when 'shipper' then 'hybrid_enterprise'
      when 'admin' then 'hybrid_enterprise'
    end
  )::tenant_workspace_type_new;

alter table organizations alter column workspace_type set default 'freight_brokerage';

drop type tenant_workspace_type;
alter type tenant_workspace_type_new rename to tenant_workspace_type;
