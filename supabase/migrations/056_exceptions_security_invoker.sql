-- 056_exceptions_security_invoker.sql
-- v_exceptions (046_exceptions_view.sql, 055_v_exceptions_expired_insurance.sql)
-- was deployed without security_invoker=true actually taking effect on the
-- live object, despite both CREATE [OR REPLACE] VIEW statements specifying
-- it in their source -- confirmed via pg_class.reloptions returning null
-- for this view while every sibling dashboard view (v_kpi_summary,
-- v_loads_by_status, v_revenue_by_week, v_top_customers) correctly showed
-- security_invoker=true. Because the view's owner (postgres) has
-- rolbypassrls=true, a non-invoker view runs with the owner's privileges
-- regardless of which client (anon-key+cookies, or service-role) queries
-- it -- RLS was bypassed entirely, leaking org-wide totals to every org.
-- This restores parity with the view's own migration source; the view's
-- query itself is unchanged.

alter view v_exceptions set (security_invoker = true);
