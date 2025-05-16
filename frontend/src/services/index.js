import api, { handleResponse } from './api.service';
import AnalyticsService from './analytics.service';
import MessageService from './message.service';
import MilestoneService from './milestone.service';
import AuditLogService from './auditLog.service';
import DocumentService from './document.service';
import LoanService from './loan.service';
import UserService from './user.service';
import NotificationService from './notification.service';
import LoanProgramService from './api/loanProgram.service';
import LoanRateService from './api/loanRate.service';

// Export all services
export {
  api,
  handleResponse,
  AnalyticsService,
  MessageService,
  MilestoneService,
  AuditLogService,
  DocumentService,
  LoanService,
  UserService,
  NotificationService,
  LoanProgramService,
  LoanRateService
};

// Export a default object with all services
export default {
  api,
  analytics: AnalyticsService,
  message: MessageService,
  milestone: MilestoneService,
  auditLog: AuditLogService,
  document: DocumentService,
  loan: LoanService,
  notification: NotificationService,
  user: UserService,
  loanProgram: LoanProgramService,
  loanRate: LoanRateService
};
