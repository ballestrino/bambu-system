import type { Prisma } from "@prisma/client";

type OpsAuditUserSelect = {
  select: {
    id: true;
    name: true;
    email: true;
  };
};

export type OpsJobListItem = Prisma.JobGetPayload<{
  include: {
    sourceBudget: {
      select: {
        id: true;
        slug: true;
        name: true;
      };
    };
    sourceBudgetOption: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsJobDetail = Prisma.JobGetPayload<{
  include: {
    sourceBudget: true;
    sourceBudgetOption: true;
    scheduleRules: true;
    occurrences: {
      include: {
        employee: true;
      };
    };
    assignments: {
      include: {
        employee: true;
      };
    };
    clientPayments: true;
    timeEntries: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsScheduleRule = Prisma.JobScheduleRuleGetPayload<{
  include: {
    job: {
      select: {
        id: true;
        name: true;
        status: true;
      };
    };
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsOccurrence = Prisma.JobOccurrenceGetPayload<{
  include: {
    job: {
      select: {
        id: true;
        name: true;
        status: true;
      };
    };
    employee: true;
    scheduleRule: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsBudgetSource = Prisma.BudgetGetPayload<{
  include: {
    budgetOptions: true;
    budgetCategory: {
      select: {
        id: true;
        name: true;
        color: true;
      };
    };
  };
}>;

export type OpsEmployee = Prisma.EmployeeGetPayload<{
  include: {
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsEmployeeDetail = Prisma.EmployeeGetPayload<{
  include: {
    assignments: {
      include: {
        job: true;
      };
    };
    payments: true;
    timeEntries: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsJobEmployeeAssignment = Prisma.JobEmployeeAssignmentGetPayload<{
  include: {
    job: true;
    employee: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsJobClientPayment = Prisma.JobClientPaymentGetPayload<{
  include: {
    job: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;

export type OpsEmployeePayment = Prisma.EmployeePaymentGetPayload<{
  include: {
    employee: true;
    createdBy: OpsAuditUserSelect;
    updatedBy: OpsAuditUserSelect;
  };
}>;
