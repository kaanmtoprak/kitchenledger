const SELECTED_ORGANIZATION_KEY = 'kitchenledger:selected-organization-id';

export function getSelectedOrganizationId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(SELECTED_ORGANIZATION_KEY);
}

export function setSelectedOrganizationId(organizationId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(SELECTED_ORGANIZATION_KEY, organizationId);
}

export function clearSelectedOrganizationId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(SELECTED_ORGANIZATION_KEY);
}
