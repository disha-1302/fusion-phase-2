import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FaCalendarAlt, FaCheck, FaCog, FaHistory, FaUserShield } from "react-icons/fa";

import { errorMessage } from "../../../lib/http";
import { PageHeader } from "../../../ui/components/PageHeader";
import {
  useAdjustBalance,
  useEmployeeSearch,
  useLeavePolicy,
  useRecordOfflineLeave,
  useRunYearEnd,
  useSlaConfig,
  useUpdatePolicy,
  useYearEndStatus,
} from "../api/hooks";
import type { LeaveCategory } from "../api/types";

export default function AdminPage() {
  const { data: policy } = useLeavePolicy();
  const updatePolicy = useUpdatePolicy();
  const recordOffline = useRecordOfflineLeave();
  const adjustBalance = useAdjustBalance();
  const runYearEnd = useRunYearEnd();
  const { data: yearEndStatus } = useYearEndStatus();
  const { data: slaList } = useSlaConfig();

  // Offline Leave state
  const [offlineSearch, setOfflineSearch] = useState("");
  const [offlineUserId, setOfflineUserId] = useState<string | null>(null);
  const [offlineCategory, setOfflineCategory] = useState<LeaveCategory>("cl");
  const [offlineStart, setOfflineStart] = useState("");
  const [offlineEnd, setOfflineEnd] = useState("");
  const [offlineRef, setOfflineRef] = useState("");
  const [offlinePurpose, setOfflinePurpose] = useState("");

  // Balance Adjust state
  const [adjSearch, setAdjSearch] = useState("");
  const [adjUserId, setAdjUserId] = useState<string | null>(null);
  const [adjCategory, setAdjCategory] = useState<LeaveCategory>("cl");
  const [adjYear, setAdjYear] = useState<number>(new Date().getFullYear());
  const [adjDays, setAdjDays] = useState<string>("1");
  const [adjNote, setAdjNote] = useState("");

  // Policy Form state
  const [clAnnual, setClAnnual] = useState<number>(8);
  const [rhAnnual, setRhAnnual] = useState<number>(2);
  const [sclAnnual, setSclAnnual] = useState<number>(15);
  const [elNonFaculty, setElNonFaculty] = useState<number>(30);
  const [vlFaculty, setVlFaculty] = useState<number>(60);
  const [colAnnual, setColAnnual] = useState<number>(20);

  const { data: offlineEmployees } = useEmployeeSearch(offlineSearch);
  const { data: adjEmployees } = useEmployeeSearch(adjSearch);

  const handleUpdatePolicy = () => {
    updatePolicy.mutate(
      {
        cl_annual: String(clAnnual),
        rh_annual: String(rhAnnual),
        scl_annual: String(sclAnnual),
        el_annual_nonfaculty: String(elNonFaculty),
        vl_annual_faculty: String(vlFaculty),
        col_annual: String(colAnnual),
      },
      {
        onSuccess: () =>
          notifications.show({ color: "green", title: "Saved", message: "Policy parameters updated." }),
        onError: (err) =>
          notifications.show({ color: "red", title: "Failed", message: errorMessage(err) }),
      }
    );
  };

  const handleOfflineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineUserId || !offlineStart || !offlineEnd || !offlineRef) {
      notifications.show({ color: "red", title: "Validation", message: "Fill all required fields." });
      return;
    }
    recordOffline.mutate(
      {
        user_id: Number(offlineUserId),
        category: offlineCategory,
        start_date: offlineStart,
        end_date: offlineEnd,
        sanction_reference: offlineRef,
        purpose: offlinePurpose,
      },
      {
        onSuccess: () => {
          notifications.show({
            color: "green",
            title: "Recorded",
            message: "Offline sanctioned leave recorded and balances updated.",
          });
          setOfflineRef("");
          setOfflinePurpose("");
        },
        onError: (err) =>
          notifications.show({ color: "red", title: "Failed", message: errorMessage(err) }),
      }
    );
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUserId || !adjDays) {
      notifications.show({ color: "red", title: "Validation", message: "Fill all required fields." });
      return;
    }
    adjustBalance.mutate(
      {
        user_id: Number(adjUserId),
        category: adjCategory,
        year: adjYear,
        days: adjDays,
        note: adjNote,
      },
      {
        onSuccess: () => {
          notifications.show({ color: "green", title: "Adjusted", message: "Balance adjusted successfully." });
          setAdjNote("");
        },
        onError: (err) =>
          notifications.show({ color: "red", title: "Failed", message: errorMessage(err) }),
      }
    );
  };

  const handleTriggerYearEnd = () => {
    runYearEnd.mutate(undefined, {
      onSuccess: () =>
        notifications.show({ color: "green", title: "Year-End Run", message: "Year-end sweep executed." }),
      onError: (err) =>
        notifications.show({ color: "red", title: "Failed", message: errorMessage(err) }),
    });
  };

  return (
    <Container size="xl">
      <PageHeader
        title="Leave Administration"
        subtitle="Policy parameters, offline record synchronization, SLA configuration, and year-end processing"
      />

      <Tabs defaultValue="policy">
        <Tabs.List mb="md">
          <Tabs.Tab value="policy" leftSection={<FaCog size={14} />}>
            Leave Policy Parameters
          </Tabs.Tab>
          <Tabs.Tab value="offline" leftSection={<FaCalendarAlt size={14} />}>
            Offline-Sanctioned Leave
          </Tabs.Tab>
          <Tabs.Tab value="balance" leftSection={<FaUserShield size={14} />}>
            Balance Adjustment
          </Tabs.Tab>
          <Tabs.Tab value="sla" leftSection={<FaHistory size={14} />}>
            SLA Thresholds
          </Tabs.Tab>
          <Tabs.Tab value="yearend" leftSection={<FaCheck size={14} />}>
            Year-End Sweep
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Policy */}
        <Tabs.Panel value="policy">
          <Card withBorder padding="lg">
            <Text fw={700} mb="sm">
              Annual Entitlements (Days)
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <NumberInput
                label="Casual Leave (CL)"
                value={policy ? Number(policy.cl_annual) : clAnnual}
                onChange={(v) => setClAnnual(Number(v))}
              />
              <NumberInput
                label="Restricted Holiday (RH)"
                value={policy ? Number(policy.rh_annual) : rhAnnual}
                onChange={(v) => setRhAnnual(Number(v))}
              />
              <NumberInput
                label="Special Casual Leave (SCL)"
                value={policy ? Number(policy.scl_annual) : sclAnnual}
                onChange={(v) => setSclAnnual(Number(v))}
              />
              <NumberInput
                label="Earned Leave Non-Faculty (EL)"
                value={policy ? Number(policy.el_annual_nonfaculty) : elNonFaculty}
                onChange={(v) => setElNonFaculty(Number(v))}
              />
              <NumberInput
                label="Vacation Leave Faculty (VL)"
                value={policy ? Number(policy.vl_annual_faculty) : vlFaculty}
                onChange={(v) => setVlFaculty(Number(v))}
              />
              <NumberInput
                label="Commuted Leave (COL)"
                value={policy ? Number(policy.col_annual) : colAnnual}
                onChange={(v) => setColAnnual(Number(v))}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="lg">
              <Button onClick={handleUpdatePolicy} loading={updatePolicy.isPending}>
                Save Policy Parameters
              </Button>
            </Group>
          </Card>
        </Tabs.Panel>

        {/* Tab 2: Offline Leave */}
        <Tabs.Panel value="offline">
          <Card withBorder padding="lg">
            <Text fw={700} mb="xs">
              Synchronize Offline / Paper-Sanctioned Leave (BR-EL-029)
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              Record leave authorized through an offline route during connectivity issues or emergency paper sanction.
              This directly marks the leave approved and updates employee balance history without initiating a new approval workflow.
            </Text>

            <form onSubmit={handleOfflineSubmit}>
              <Stack gap="sm">
                <Select
                  label="Employee"
                  placeholder="Search employee..."
                  searchable
                  required
                  searchValue={offlineSearch}
                  onSearchChange={setOfflineSearch}
                  value={offlineUserId}
                  onChange={setOfflineUserId}
                  data={(offlineEmployees ?? []).map((e) => ({
                    value: String(e.user_id),
                    label: `${e.display_name} (${e.department || e.kind})`,
                  }))}
                />

                <Group grow>
                  <Select
                    label="Category"
                    value={offlineCategory}
                    onChange={(v) => setOfflineCategory((v as LeaveCategory) || "cl")}
                    data={[
                      { value: "cl", label: "Casual Leave" },
                      { value: "rh", label: "Restricted Holiday" },
                      { value: "scl", label: "Special Casual Leave" },
                      { value: "el", label: "Earned Leave" },
                      { value: "col", label: "Commuted Leave" },
                      { value: "vl", label: "Vacation Leave" },
                    ]}
                  />
                  <TextInput
                    label="Sanction Order / Paper Reference"
                    placeholder="e.g. EST/2026/L-891"
                    required
                    value={offlineRef}
                    onChange={(e) => setOfflineRef(e.currentTarget.value)}
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="Start Date"
                    type="date"
                    required
                    value={offlineStart}
                    onChange={(e) => setOfflineStart(e.currentTarget.value)}
                  />
                  <TextInput
                    label="End Date"
                    type="date"
                    required
                    value={offlineEnd}
                    onChange={(e) => setOfflineEnd(e.currentTarget.value)}
                  />
                </Group>

                <Textarea
                  label="Purpose / Remarks"
                  value={offlinePurpose}
                  onChange={(e) => setOfflinePurpose(e.currentTarget.value)}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" loading={recordOffline.isPending}>
                    Record Sanctioned Leave
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        {/* Tab 3: Balance Adjustment */}
        <Tabs.Panel value="balance">
          <Card withBorder padding="lg">
            <Text fw={700} mb="xs">
              Administrative Balance Adjustment (BR-EL-037)
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              Maintain and correct balances. Recorded as an audited maintenance transaction, never as a sanction.
            </Text>

            <form onSubmit={handleAdjustSubmit}>
              <Stack gap="sm">
                <Select
                  label="Employee"
                  placeholder="Search employee..."
                  searchable
                  required
                  searchValue={adjSearch}
                  onSearchChange={setAdjSearch}
                  value={adjUserId}
                  onChange={setAdjUserId}
                  data={(adjEmployees ?? []).map((e) => ({
                    value: String(e.user_id),
                    label: `${e.display_name} (${e.department || e.kind})`,
                  }))}
                />

                <Group grow>
                  <Select
                    label="Category"
                    value={adjCategory}
                    onChange={(v) => setAdjCategory((v as LeaveCategory) || "cl")}
                    data={[
                      { value: "cl", label: "Casual Leave" },
                      { value: "rh", label: "Restricted Holiday" },
                      { value: "scl", label: "Special Casual Leave" },
                      { value: "el", label: "Earned Leave" },
                      { value: "col", label: "Commuted Leave" },
                      { value: "vl", label: "Vacation Leave" },
                    ]}
                  />
                  <NumberInput
                    label="Year"
                    value={adjYear}
                    onChange={(v) => setAdjYear(Number(v))}
                  />
                  <TextInput
                    label="Days (+ to add, - to deduct)"
                    value={adjDays}
                    onChange={(e) => setAdjDays(e.currentTarget.value)}
                  />
                </Group>

                <Textarea
                  label="Administrative Reason / Order Ref"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.currentTarget.value)}
                />

                <Group justify="flex-end" mt="md">
                  <Button type="submit" loading={adjustBalance.isPending}>
                    Apply Adjustment
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        {/* Tab 4: SLA */}
        <Tabs.Panel value="sla">
          <Card withBorder padding="lg">
            <Text fw={700} mb="md">
              Configured Workflow SLA Thresholds
            </Text>
            <Stack gap="xs">
              {(slaList ?? []).map((s: any) => (
                <Card key={s.id || s.task_class} withBorder padding="sm">
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text fw={600} size="sm">
                        {String(s.task_class).replace(/_/g, " ").toUpperCase()}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Reminder threshold: {s.reminder_hours ?? "—"} hrs • Escalation threshold:{" "}
                        {s.escalation_hours ?? "—"} hrs
                      </Text>
                    </Stack>
                    <Badge variant="outline">
                      Escalates to: #{s.escalation_user_id ?? "Default Authority"}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Tab 5: Year-End */}
        <Tabs.Panel value="yearend">
          <Card withBorder padding="lg">
            <Text fw={700} mb="xs">
              Event-Triggered Year-End Leave Processing (BR-EL-002…009, EL-UC-020)
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              Applies defined year-end boundaries: unused CL, RH, and SCL lapse; unused faculty VL converts to EL at 2:1
              including fractions; EL and COL carry forward into the next year.
            </Text>

            {yearEndStatus && (
              <Alert color="blue" mb="md">
                <Text size="sm">
                  Boundary Month/Day: {String((yearEndStatus as any).boundary_month ?? 12)}/
                  {String((yearEndStatus as any).boundary_day ?? 31)} • Current Year:{" "}
                  {String((yearEndStatus as any).current_year ?? new Date().getFullYear())}
                </Text>
              </Alert>
            )}

            <Button color="indigo" onClick={handleTriggerYearEnd} loading={runYearEnd.isPending}>
              Execute Year-End Sweep Now
            </Button>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
