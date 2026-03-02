const BASE_URL = "https://api.codecarbon.io";

interface CarbonSums {
  totalEmissions: number;
  totalEnergy: number;
  totalDuration: number;
}

export async function createOrganization(token: string, name: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/organizations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`CodeCarbon createOrganization failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function createProject(token: string, orgId: string, name: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`CodeCarbon createProject failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function pushEmission(
  token: string,
  runId: string,
  data: { emissions: number; energy_consumed: number; duration: number },
): Promise<void> {
  const res = await fetch(`${BASE_URL}/runs/${runId}/emissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`CodeCarbon pushEmission failed: ${res.status}`);
}

export async function getOrgSums(token: string, orgId: string): Promise<CarbonSums> {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/sums`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`CodeCarbon getOrgSums failed: ${res.status}`);
  return res.json();
}

export async function getProjectSums(token: string, projectId: string): Promise<CarbonSums> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/sums`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`CodeCarbon getProjectSums failed: ${res.status}`);
  return res.json();
}
