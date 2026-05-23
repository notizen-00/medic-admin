<script setup lang="ts">
import { getUser } from "~/services/shared/users";

const route = useRoute();
const toast = useToast();
const config = useRuntimeConfig();

const id = computed(() => String(route.params.id || ""));

const { data, pending, error, refresh } = await useAsyncData(
  () => `partner:${id.value}`,
  async () => {
    const res = await getUser(id.value);
    return res.data;
  },
  { watch: [id] },
);

const strPhotoOk = ref(true);
const ktpPhotoOk = ref(true);

const strPhotoApiUrl = computed(() =>
  strPhotoOk.value
    ? `/api/shared/secure-image/partners/${id.value}/documents/str`
    : undefined,
);

const ktpPhotoApiUrl = computed(() =>
  ktpPhotoOk.value
    ? `/api/shared/secure-image/partners/${id.value}/documents/ktp`
    : undefined,
);

const { src: strPhotoUrl } = useSecureImage(strPhotoApiUrl);
const { src: ktpPhotoUrl } = useSecureImage(ktpPhotoApiUrl);

type VerificationStatus = "pending" | "verified" | "rejected";

const verificationBadge = computed(() => {
  const status = (data.value?.partner_profile?.verification_status ||
    (data.value as any)?.verification_status) as VerificationStatus | undefined;

  if (!status) return { color: "neutral" as const, label: "-" };

  const colorMap: Record<VerificationStatus, "warning" | "success" | "error"> =
    {
      pending: "warning",
      verified: "success",
      rejected: "error",
    };
  const labelMap: Record<VerificationStatus, string> = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
  };

  return { color: colorMap[status], label: labelMap[status] };
});

function professionLabel(p?: string) {
  if (p === "dokter") return "Dokter";
  if (p === "perawat") return "Perawat";
  if (p === "bidan") return "Bidan";
  return "-";
}

async function copyId() {
  const value = String(data.value?.id || "");
  if (!value) return;
  await globalThis.navigator?.clipboard?.writeText(value);
  toast.add({ title: "Copied", description: "Partner ID disalin." });
}
</script>

<template>
  <UDashboardPanel id="patient-detail">
    <template #header>
      <UDashboardNavbar
        :title="data?.name ? `Patient: ${data.name}` : 'Patient Detail'"
      >
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo('/patients')"
          />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="outline"
            :disabled="!data?.id"
            @click="copyId"
          >
            Copy ID
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Gagal memuat data"
        :description="(error as any)?.message || 'Terjadi kesalahan.'"
      />

      <div v-else class="grid gap-4 lg:grid-cols-3">
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <UAvatar :src="strPhotoUrl" :alt="data?.name" size="xl" />

                <div class="space-y-0.5 min-w-0">
                  <div class="text-sm text-dimmed">Informasi Dasar</div>
                  <div class="text-lg font-semibold">
                    {{ data?.name || "-" }}
                  </div>
                </div>
              </div>
              <UBadge variant="subtle" color="neutral">
                {{ data?.role || "mitra" }}
              </UBadge>
            </div>
          </template>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <div class="text-xs text-dimmed">Email</div>
              <div class="font-medium">
                {{ data?.email || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-dimmed">Phone</div>
              <div class="font-medium">
                {{ data?.phone || "-" }}
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="text-sm text-dimmed">Status</div>
          </template>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm">Profesi</div>
              <UBadge variant="subtle" color="neutral">
                {{ professionLabel(data?.partner_profile?.profession) }}
              </UBadge>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="text-sm">Availability</div>
              <UBadge
                :color="
                  data?.partner_profile?.is_available ? 'success' : 'error'
                "
                variant="subtle"
              >
                {{
                  data?.partner_profile?.is_available
                    ? "Available"
                    : "Unavailable"
                }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <UCard class="lg:col-span-3">
          <template #header>
            <div class="text-sm text-dimmed">Profil Mitra</div>
          </template>

          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <div class="text-xs text-dimmed">Spesialisasi</div>
              <div class="font-medium">
                {{ data?.partner_profile?.specialization || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-dimmed">Lokasi Kerja</div>
              <div class="font-medium">
                {{ data?.partner_profile?.work_location || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-dimmed">Nomor Izin</div>
              <div class="font-medium">
                {{ data?.partner_profile?.license_number || "-" }}
              </div>
            </div>
            <div>
              <div class="text-xs text-dimmed">Verifikasi</div>
              <UBadge :color="verificationBadge.color" variant="subtle">
                {{ verificationBadge.label }}
              </UBadge>
            </div>

            <div>
              <div class="text-xs text-dimmed">Foto STR</div>
              <div class="mt-2">
                <img
                  v-if="strPhotoUrl"
                  :src="strPhotoUrl"
                  :alt="`${data?.name || 'Partner'} - STR`"
                  class="w-full max-w-md rounded-md border border-default object-contain bg-elevated/40"
                  loading="lazy"
                  @error="
                    () => {
                      strPhotoOk = false;
                    }
                  "
                />
                <div v-else class="text-sm text-muted">-</div>
              </div>
            </div>

            <div>
              <div class="text-xs text-dimmed">Foto KTP</div>
              <div class="mt-2">
                <img
                  v-if="ktpPhotoUrl"
                  :src="ktpPhotoUrl"
                  :alt="`${data?.name || 'Partner'} - KTP`"
                  class="w-full max-w-md rounded-md border border-default object-contain bg-elevated/40"
                  loading="lazy"
                  @error="
                    () => {
                      ktpPhotoOk = false;
                    }
                  "
                />
                <div v-else class="text-sm text-muted">-</div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <USkeleton v-if="pending" class="h-32 w-full mt-4" />
    </template>
  </UDashboardPanel>
</template>
