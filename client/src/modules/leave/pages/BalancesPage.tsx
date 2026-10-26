import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { FaBookOpen } from "react-icons/fa";

import { ErrorState } from "../../../ui/components/ErrorState";
import { PageHeader } from "../../../ui/components/PageHeader";
import { useLeaveBalances } from "../api/hooks";
import type { LeaveBalance } from "../api/types";
import { LedgerModal } from "../components/LedgerModal";

const CATEGORY_NAMES: Record<string, string> = {
  cl: "Casual Leave",
  rh: "Restricted Holiday",
  scl: "Special Casual Leave",
  el: "Earned Leave",
  col: "Commuted Leave",
  vl: "Vacation Leave",
};

export default function BalancesPage() {
  const { data, isPending, error } = useLeaveBalances();
  const [ledgerUserId, setLedgerUserId] = useState<number | null>(null);

  if (error) {
    return (
      <Container size="xl">
        <ErrorState error={error} />
      </Container>
    );
  }

  const balances = data?.results ?? [];
  const year = data?.year ?? new Date().getFullYear();

  return (
    <Container size="xl">
      <PageHeader
        title={`Leave Balances (${year})`}
        subtitle="Entitlements, carried-over allowances, and remaining balance for this leave year"
        action={
          <Button
            leftSection={<FaBookOpen />}
            variant="light"
            onClick={() => setLedgerUserId(balances[0]?.user_id ?? 0)}
          >
            View Account Ledger
          </Button>
        }
      />

      {isPending ? (
        <Text size="sm" c="dimmed">Loading balances…</Text>
      ) : !balances.length ? (
        <Card withBorder padding="lg">
          <Text size="sm" c="dimmed">No balance rows found for year {year}.</Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {balances.map((b: LeaveBalance) => {
            const avail = Number(b.available);
            return (
              <Card key={b.id || b.category} padding="lg" withBorder radius="md">
                <Group justify="space-between" mb="xs">
                  <Text fw={700} size="md">
                    {CATEGORY_NAMES[b.category] || b.category.toUpperCase()}
                  </Text>
                  <Badge variant="filled" size="lg" color={avail > 0 ? "teal" : "gray"}>
                    {avail} {avail === 1 ? "day" : "days"} left
                  </Badge>
                </Group>

                <Stack gap={4} mt="sm">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Annual Credited:</Text>
                    <Text size="xs" fw={500}>{b.credited} days</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Carried Forward:</Text>
                    <Text size="xs" fw={500}>{b.carried_forward} days</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Used / Consumed:</Text>
                    <Text size="xs" fw={500} c="red">{b.used} days</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Administrative / Conversions:</Text>
                    <Text size="xs" fw={500}>{b.adjusted} days</Text>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <LedgerModal userId={ledgerUserId} onClose={() => setLedgerUserId(null)} />
    </Container>
  );
}
