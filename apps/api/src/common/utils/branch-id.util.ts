import { Request } from 'express';

export function extractBranchId(request: Request): string | undefined {
  const paramId = request.params?.branchId;
  if (typeof paramId === 'string' && paramId.length > 0) {
    return paramId;
  }

  const body = request.body as { branchId?: unknown } | undefined;
  if (typeof body?.branchId === 'string' && body.branchId.length > 0) {
    return body.branchId;
  }

  const queryBranchId = request.query.branchId;
  if (typeof queryBranchId === 'string' && queryBranchId.length > 0) {
    return queryBranchId;
  }

  return undefined;
}
