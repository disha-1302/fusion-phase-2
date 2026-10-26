import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { http } from "../../../lib/http";
import type {
  CancellationRequest,
  EmployeeSearchResult,
  ExtensionRequest,
  LeaveBalance,
  LeaveEvent,
  LeavePolicy,
  LeaveRequest,
  LeaveResumption,
  Page,
  ResumptionRequest,
  ResumptionReviewRequest,
  ReviewRequest,
  SanctionRequest,
  SubmitLeaveRequest,
  SubstituteResponse,
} from "./types";

const KEY = "leave";

export const leaveKeys = {
  all: [KEY] as const,
  requests: (f?: unknown) => [KEY, "requests", f] as const,
  request: (id: number) => [KEY, "request", id] as const,
  history: (id: number) => [KEY, "history", id] as const,
  tasks: () => [KEY, "tasks"] as const,
  balances: (f?: unknown) => [KEY, "balances", f] as const,
  ledger: (f?: unknown) => [KEY, "ledger", f] as const,
  calendar: () => [KEY, "calendar"] as const,
  policy: () => [KEY, "policy"] as const,
  employees: (q?: string) => [KEY, "employees", q] as const,
  calendars: () => [KEY, "calendars"] as const,
  vacations: () => [KEY, "vacations"] as const,
  orgUnits: () => [KEY, "org-units"] as const,
  authorities: () => [KEY, "authorities"] as const,
  sla: () => [KEY, "sla"] as const,
  yearEnd: () => [KEY, "year-end"] as const,
};

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [KEY] });
}

export function useLeaveRequests(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: leaveKeys.requests(filters),
    queryFn: async () =>
      (await http.get<Page<LeaveRequest>>("/leave/requests", { params: filters })).data,
    staleTime: 15_000,
  });
}

export function useLeaveRequest(id: number | undefined) {
  return useQuery({
    queryKey: leaveKeys.request(id!),
    queryFn: async () => (await http.get<LeaveRequest>(`/leave/requests/${id}`)).data,
    enabled: typeof id === "number" && !isNaN(id),
  });
}

export function useLeaveHistory(id: number | undefined) {
  return useQuery({
    queryKey: leaveKeys.history(id!),
    queryFn: async () =>
      (await http.get<{ count: number; results: LeaveEvent[] }>(`/leave/requests/${id}/history`))
        .data,
    enabled: typeof id === "number" && !isNaN(id),
  });
}

export function useLeaveTasks() {
  return useQuery({
    queryKey: leaveKeys.tasks(),
    queryFn: async () =>
      (await http.get<Page<LeaveRequest>>("/leave/tasks")).data,
    staleTime: 15_000,
  });
}

export function useLeaveBalances(params?: { user_id?: number; year?: number }) {
  return useQuery({
    queryKey: leaveKeys.balances(params),
    queryFn: async () =>
      (
        await http.get<{ count: number; results: LeaveBalance[]; year: number }>(
          "/leave/balances",
          { params }
        )
      ).data,
    staleTime: 30_000,
  });
}

export function useBalanceLedger(params?: { user_id?: number }) {
  return useQuery({
    queryKey: leaveKeys.ledger(params),
    queryFn: async () =>
      (
        await http.get<{ count: number; results: Array<Record<string, unknown>> }>(
          "/leave/balances/ledger",
          { params }
        )
      ).data,
    staleTime: 30_000,
  });
}

export function useLeavePolicy() {
  return useQuery({
    queryKey: leaveKeys.policy(),
    queryFn: async () => (await http.get<LeavePolicy>("/leave/policy")).data,
    staleTime: 60_000,
  });
}

export function useEffectiveCalendar() {
  return useQuery({
    queryKey: leaveKeys.calendar(),
    queryFn: async () =>
      (await http.get<Record<string, unknown>>("/leave/calendar")).data,
    staleTime: 60_000,
  });
}

export function useEmployeeSearch(q: string) {
  return useQuery({
    queryKey: leaveKeys.employees(q),
    queryFn: async () =>
      (await http.get<EmployeeSearchResult[]>("/leave/employees", { params: { q } })).data,
    enabled: q.trim().length >= 1,
  });
}

export function useAdminCalendars() {
  return useQuery({
    queryKey: leaveKeys.calendars(),
    queryFn: async () =>
      (await http.get<Array<Record<string, unknown>>>("/leave/calendars")).data,
  });
}

export function useOrgUnits() {
  return useQuery({
    queryKey: leaveKeys.orgUnits(),
    queryFn: async () =>
      (await http.get<Array<Record<string, unknown>>>("/leave/org-units")).data,
  });
}

export function useAuthorities() {
  return useQuery({
    queryKey: leaveKeys.authorities(),
    queryFn: async () =>
      (await http.get<Array<Record<string, unknown>>>("/leave/authorities")).data,
  });
}

export function useSlaConfig() {
  return useQuery({
    queryKey: leaveKeys.sla(),
    queryFn: async () =>
      (await http.get<Array<Record<string, unknown>>>("/leave/sla")).data,
  });
}

export function useYearEndStatus() {
  return useQuery({
    queryKey: leaveKeys.yearEnd(),
    queryFn: async () =>
      (await http.get<Record<string, unknown>>("/leave/admin/year-end")).data,
  });
}

// -- Mutations --
export function useSubmitLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitLeaveRequest) =>
      (await http.post<LeaveRequest>("/leave/requests", payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/withdraw`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CancellationRequest }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/cancellation`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useExtendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ExtensionRequest }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/extension`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useResumeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ResumptionRequest }) =>
      (await http.post<LeaveResumption>(`/leave/requests/${id}/resumption`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useNominateSubstitute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, substitute_user_id }: { id: number; substitute_user_id: number }) =>
      (
        await http.post<LeaveRequest>(`/leave/requests/${id}/substitute`, {
          substitute_user_id,
        })
      ).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useSubstituteRespond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: SubstituteResponse }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/substitute/respond`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useReviewRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ReviewRequest }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/review`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useRouteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/route`, { note })).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useSanctionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: SanctionRequest }) =>
      (await http.post<LeaveRequest>(`/leave/requests/${id}/sanction`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useReviewResumption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ResumptionReviewRequest }) =>
      (await http.post<LeaveResumption>(`/leave/resumptions/${id}/review`, payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LeavePolicy>) =>
      (await http.put<LeavePolicy>("/leave/policy", payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useRecordOfflineLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await http.post<LeaveRequest>("/leave/admin/offline-leave", payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useAdjustBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: number; category: string; year: number; days: string; note?: string }) =>
      (await http.post("/leave/admin/balances/adjust", payload)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useRunYearEnd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await http.post("/leave/admin/year-end")).data,
    onSuccess: () => invalidate(qc),
  });
}
