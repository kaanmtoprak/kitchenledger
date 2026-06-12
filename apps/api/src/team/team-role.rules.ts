import { ForbiddenException } from '@nestjs/common';
import { Role } from '@kitchenledger/db';

const ADMIN_ASSIGNABLE_ROLES: Role[] = [
  Role.BRANCH_MANAGER,
  Role.STAFF,
  Role.VIEWER,
];

export function requiresBranchAssignment(role: Role): boolean {
  return (
    role === Role.BRANCH_MANAGER || role === Role.STAFF || role === Role.VIEWER
  );
}

export function assertActorCanAssignRole(
  actorRole: Role,
  targetRole: Role,
): void {
  if (targetRole === Role.OWNER && actorRole !== Role.OWNER) {
    throw new ForbiddenException('Only owners can assign the owner role');
  }

  if (targetRole === Role.ADMIN && actorRole !== Role.OWNER) {
    throw new ForbiddenException('Only owners can assign the admin role');
  }

  if (
    actorRole === Role.ADMIN &&
    !ADMIN_ASSIGNABLE_ROLES.includes(targetRole)
  ) {
    throw new ForbiddenException(
      'Admins can only assign branch manager, staff, or viewer roles',
    );
  }
}

export function assertActorCanManageTarget(
  actorRole: Role,
  targetRole: Role,
): void {
  if (
    actorRole === Role.ADMIN &&
    (targetRole === Role.OWNER || targetRole === Role.ADMIN)
  ) {
    throw new ForbiddenException('Admins cannot manage owner or admin members');
  }
}

export function getAssignableRoles(actorRole: Role): Role[] {
  if (actorRole === Role.OWNER) {
    return [
      Role.OWNER,
      Role.ADMIN,
      Role.BRANCH_MANAGER,
      Role.STAFF,
      Role.VIEWER,
    ];
  }

  if (actorRole === Role.ADMIN) {
    return ADMIN_ASSIGNABLE_ROLES;
  }

  return [];
}
