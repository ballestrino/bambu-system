import type { Prisma } from "@prisma/client";

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
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type OpsJobDetail = Prisma.JobGetPayload<{
  include: {
    sourceBudget: true;
    sourceBudgetOption: true;
    scheduleRules: true;
    occurrences: true;
    assignments: {
      include: {
        employee: true;
      };
    };
    clientPayments: true;
    timeEntries: true;
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
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
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
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
    scheduleRule: true;
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
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
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
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
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export type OpsJobEmployeeAssignment = Prisma.JobEmployeeAssignmentGetPayload<{
  include: {
    job: true;
    employee: true;
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    updatedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;
