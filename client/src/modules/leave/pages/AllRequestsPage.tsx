import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { FaHistory, FaSearch } from "react-icons/fa";

import { DataTable } from "../../../ui/components/DataTable";
import { ErrorState } from "../../../ui/components/ErrorState";
import { PageHeader } from "../../../ui/components/PageHeader";
import { StatusBadge } from "../../../ui/components/StatusBadge";
import { useLeaveRequests } from "../api/hooks";
import type { LeaveRequest } from "../api/types";
import { LeaveHistoryDrawer } from "../components/HistoryDrawer";
import { type ActionType, LeaveActionModal } from "../components/LeaveActionModal";

export default function AllRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, isPending, error } = useLeaveRequests();
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  if (error) {
    return (
      <Container size="xl">
        <ErrorState error={error} />
      </Container>
    );
  }

  const allRows = (data?.results ?? []) as LeaveRequest[];
  const filtered = allRows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.applicant_name?.toLowerCase().includes(q);
      const matchId = String(r.id).includes(q) || String(r.user_id).includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  const triggerAction = (req: LeaveRequest, act: ActionType) => {
    setSelectedRequest(req);
    setActiveAction(act);
  };

  return (
    <Container size="xl">
      <PageHeader
        title="All Leave Requests"
        subtitle="Departmental and institute leave requests within your authorization scope"
      />

      <Card padding="md" withBorder mb="md">
        <Group grow>
          <TextInput
            placeholder="Search by applicant name or request ID..."
            leftSection={<FaSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Filter by category"
            clearable
            value={categoryFilter}
            onChange={setCategoryFilter}
            data={[
              { value: "cl", label: "Casual Leave (CL)" },
              { value: "rh", label: "Restricted Holiday (RH)" },
              { value: "scl", label: "Special Casual Leave (SCL)" },
              { value: "el", label: "Earned Leave (EL)" },
              { value: "col", label: "Commuted Leave (COL)" },
              { value: "vl", label: "Vacation Leave (VL)" },
            ]}
          />
          <Select
            placeholder="Filter by status"
            clearable
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: "awaiting_substitute_response", label: "Awaiting substitute" },
              { value: "applicant_action_required", label: "Applicant action required" },
              { value: "awaiting_unit_head_review", label: "Awaiting Unit Head" },
              { value: "awaiting_establishment_routing", label: "Awaiting establishment" },
              { value: "awaiting_final_sanction_decision", label: "Awaiting final sanction" },
              { value: "awaiting_director_self_sanction", label: "Awaiting Director sanction" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "withdrawn", label: "Withdrawn" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </Group>
      </Card>

      <Card padding="lg" withBorder>
        <DataTable<LeaveRequest>
          rows={filtered}
          loading={isPending}
          rowKey={(r) => r.id}
          minWidth={950}
          empty={{
            title: "No leave requests found",
            description: "No leave requests matched the selected filters.",
          }}
          columns={[
            {
              key: "id",
              header: "Request",
              render: (r) => (
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {r.applicant_name || `User #${r.user_id}`}
                  </Text>
                  <Group gap="xs">
                    <Badge size="xs" variant="filled" color="indigo">
                      {r.category.toUpperCase()}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      #{r.id} {r.kind !== "new" ? `(${r.kind})` : ""}
                    </Text>
                  </Group>
                </Stack>
              ),
            },
            {
              key: "period",
              header: "Dates & Days",
              render: (r) => (
                <Stack gap={0}>
                  <Text size="sm">
                    {r.start_date} → {r.end_date}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.chargeable_days} days {r.half_day !== "none" ? `(${r.half_day})` : ""}
                  </Text>
                </Stack>
              ),
            },
            {
              key: "substitute",
              header: "Substitute",
              render: (r) =>
                r.substitute_user_id ? (
                  <Stack gap={0}>
                    <Text size="sm">{r.substitute_name || `#${r.substitute_user_id}`}</Text>
                    <Text size="xs" c="dimmed">
                      {r.substitute_status}
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    None
                  </Text>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r) => (
                <Group justify="flex-end" gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="History"
                    onClick={() => setHistoryId(r.id)}
                  >
                    <FaHistory size={14} />
                  </ActionIcon>

                  {r.allowed_actions?.includes("review") && (
                    <Button
                      size="xs"
                      color="blue"
                      onClick={() => triggerAction(r, "review")}
                    >
                      Review
                    </Button>
                  )}

                  {r.allowed_actions?.includes("route") && (
                    <Button
                      size="xs"
                      color="cyan"
                      onClick={() => triggerAction(r, "route")}
                    >
                      Route
                    </Button>
                  )}

                  {r.allowed_actions?.includes("sanction") && (
                    <Button
                      size="xs"
                      color="teal"
                      onClick={() => triggerAction(r, "sanction")}
                    >
                      Sanction
                    </Button>
                  )}

                  {r.allowed_actions?.includes("review_resumption") && (
                    <Button
                      size="xs"
                      color="indigo"
                      onClick={() => triggerAction(r, "review_resumption")}
                    >
                      Resumption
                    </Button>
                  )}
                </Group>
              ),
            },
          ]}
        />
      </Card>

      <LeaveHistoryDrawer requestId={historyId} onClose={() => setHistoryId(null)} />

      <LeaveActionModal
        action={activeAction}
        request={selectedRequest}
        onClose={() => {
          setActiveAction(null);
          setSelectedRequest(null);
        }}
      />
    </Container>
  );
}
