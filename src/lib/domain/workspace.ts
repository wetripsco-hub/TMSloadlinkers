import type { WorkspaceType } from "../../../types/domain";

export type FinancialFieldKey =
  | "shipperRate"
  | "carrierPay"
  | "brokerMargin"
  | "dispatcherCommissionEarned";

const BROKER_FIELDS: FinancialFieldKey[] = ["shipperRate", "carrierPay", "brokerMargin"];
const DISPATCHER_FIELDS: FinancialFieldKey[] = ["carrierPay", "dispatcherCommissionEarned"];
const HYBRID_FIELDS: FinancialFieldKey[] = [
  "shipperRate",
  "carrierPay",
  "brokerMargin",
  "dispatcherCommissionEarned",
];

const VISIBLE_FIELDS_BY_WORKSPACE_TYPE: Record<WorkspaceType, FinancialFieldKey[]> = {
  freight_brokerage: BROKER_FIELDS,
  truck_dispatch: DISPATCHER_FIELDS,
  hybrid_enterprise: HYBRID_FIELDS,
};

export function getVisibleFinancialFields(workspaceType: WorkspaceType): FinancialFieldKey[] {
  return VISIBLE_FIELDS_BY_WORKSPACE_TYPE[workspaceType];
}
