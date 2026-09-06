-- =====================================================================
-- 027_needs_shipper_rate.sql
--
-- A load created from a RateCon's OCR extraction has a carrier_pay (the
-- RateCon states what the carrier is paid) but no real shipper_rate --
-- a RateCon never states what the shipper is billed. shipper_rate is
-- left at its column default (0) rather than fabricated, and this flag
-- marks that as an explicit incomplete state (not "the load really pays
-- $0") so UI and reporting can surface it rather than silently trusting
-- shipper_rate = 0.
-- =====================================================================

begin;

alter table loads add column needs_shipper_rate boolean not null default false;

commit;
