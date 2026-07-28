# Admin Portal Documentation

## Overview

The Admin Portal provides enterprise administrators with tools to manage content, students, and system operations. This document outlines the key features and components of the admin interface.

## Architecture

### Authorization Model

The admin portal uses **Enterprise RBAC (Role-Based Access Control)** with the following roles:

- **SUPER_ADMIN**: Full system access, including audit logs and analytics
- **ADMIN**: Standard admin access to content and students
- **CONTENT_MANAGER**: Can create and manage content (modules, resources, questions)
- **QUESTION_REVIEWER**: Can review and modify questions
- **STUDENT_MANAGER**: Can manage student enrollment and status
- **FINANCE_MANAGER**: Can access billing and financial metrics
- **SUPPORT_AGENT**: Can provide support to students

Each role is mapped to specific permissions in [server/services/permission.service.ts](server/services/permission.service.ts).

### Key Sections

#### 1. Audit Logs (`/admin/audit-logs`)

**Purpose**: Track all privileged admin actions for compliance and auditing.

**Features**:
- Paginated table of audit events
- Filter by: timestamp, actor, action type, entity type, status
- Shows: timestamp, actor name/role, action, entity, status (success/failed)

**Permissions Required**: `manageAuditLogs` (SUPER_ADMIN, ADMIN only)

**Backend Implementation**:
- [server/services/audit-log.service.ts](server/services/audit-log.service.ts) - Audit event recording and retrieval
- [server/repositories/audit.repository.ts](server/repositories/audit.repository.ts) - Prisma data access layer
- [server/actions/audit-helpers.ts](server/actions/audit-helpers.ts) - withAuditLogging() wrapper for auto-recording

**Tracked Actions**:
- Module: create, update, archive, unarchive
- Student: suspend, reactivate, reset-progress
- Resource: create, update, archive, publish, unarchive
- Question: create, update, archive, unarchive
- Content: submit-for-review, approve, reject, publish, unpublish, archive

#### 2. Analytics Dashboard (`/admin/analytics`)

**Purpose**: Display enterprise-wide metrics for learning, content, and system health.

**Features**:
- Overview cards: Total students, active students, new registrations, total questions, published content
- Student metrics: total, active, new registrations
- Learning metrics: module completion rate, resource usage, most studied modules
- Question bank: total questions, difficulty distribution, questions by module, recently added
- Mock exams: total attempts, average score, pass rate, completion rate
- Publishing metrics: content by status (draft/published/archived), by entity type

**Permissions Required**: `viewAnalytics` (SUPER_ADMIN, ADMIN, CONTENT_MANAGER, STUDENT_MANAGER, FINANCE_MANAGER)

**Backend Implementation**:
- [server/services/analytics.service.ts](server/services/analytics.service.ts) - Aggregates metrics from repositories
- [server/application/dto/analytics.dto.ts](server/application/dto/analytics.dto.ts) - Typed data transfer objects
- [server/actions/analytics.actions.ts](server/actions/analytics.actions.ts) - Server action with permission check

**Metrics Calculation**:

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Students | userRepository.countStudents() | Direct count of STUDENT role |
| Active Students | userRepository.countStudentsForAdmin(status: ACTIVE) | Count where isActive=true |
| New Registrations (30d) | Calculated as 15% of total* | *Placeholder pending date-filtered queries |
| Module Completion Rate | progressRepository.findCompletedCourses() | completed_count / total_progress_count × 100 |
| Resource Usage | progressRepository resources | Count of study materials accessed |
| Most Studied Modules | Aggregated from progressRepository | Group by courseId, count occurrences |
| Total Questions | questionRepository.countAll() | Direct count |
| Questions by Difficulty | questionRepository.findAll() | Group by difficulty enum |
| Questions by Module | questionRepository.findAll() | Group by questionBankId |
| Mock Exam Attempts | examAttemptRepository.countAll() | Total exam attempts |
| Exam Pass Rate | examAttemptRepository | Calculated from score threshold (70+)* |
| Exam Average Score | examAttemptRepository | Mean of all scores |
| Exam Completion Rate | Calculated from attempts | Submitted attempts / total × 100 |
| Published Content | moduleRepository, resourceRepository, questionRepository | Count where status='PUBLISHED' |
| Draft Content | Sum of all entities | Count where status='DRAFT' |
| Archived Content | Sum of all entities | Count where status='ARCHIVED' |

*Placeholder values: Trends (daily registrations, exam attempts, study sessions) are returned as `null` pending schema support for time-series data.

## Directory Structure

```
app/(admin)/
├── admin/
│   ├── analytics/
│   │   └── page.tsx           # Analytics dashboard page
│   ├── audit-logs/
│   │   └── page.tsx           # Audit logs listing page
│   ├── courses/               # Course management
│   ├── dashboard/             # Admin dashboard
│   ├── modules/               # Module management
│   ├── questions/             # Question management
│   ├── students/              # Student management
│   ├── materials/             # Study material management
│   ├── mock-tests/            # Mock exam management
│   └── ...other sections

server/
├── actions/
│   ├── analytics.actions.ts         # Analytics dashboard action
│   ├── audit-helpers.ts             # Audit logging wrapper
│   ├── content-management.actions.ts # Module/content actions (audit logged)
│   ├── student-management.actions.ts # Student actions (audit logged)
│   └── ...more actions
├── services/
│   ├── analytics.service.ts         # Enterprise analytics aggregation
│   ├── audit-log.service.ts         # Audit event recording/retrieval
│   ├── permission.service.ts        # RBAC permission mapping
│   └── ...more services
├── repositories/
│   ├── audit.repository.ts          # Audit log data access
│   ├── user.repository.ts           # User/student data access
│   ├── module.repository.ts         # Module data access
│   ├── question.repository.ts       # Question data access
│   └── ...more repositories
```

## Integration Points

### Adding Audit Logging to an Action

When creating a new privileged admin action, use the `withAuditLogging()` helper:

```typescript
import { withAuditLogging } from '@/server/actions/audit-helpers'

export const myPrivilegedAction = withAuditLogging(
  'manageModules',           // Required permission
  'module.create',           // Action name for audit log
  'MODULE',                  // Entity type
  async (input) => {         // run function
    // Your business logic
    return { id: '123' }     // Return object with optional 'id' for entityId
  }
)
```

The helper automatically:
1. Enforces the permission check
2. Records success/failure with metadata
3. Extracts entityId from result
4. Logs any error details

### Accessing Analytics in Code

```typescript
import { getAnalyticsDashboardAction } from '@/server/actions/analytics.actions'

// In a Server Component or Server Action
const dashboard = await getAnalyticsDashboardAction()
// Returns EnterpriseAnalyticsDashboardDTO with all metrics
```

## Testing

### Audit Logging Tests

- `tests/services/audit-log.service.test.ts` - Service layer tests
- `tests/services/audit.repository.test.ts` - Repository layer tests
- `tests/actions/audit-logging.test.ts` - Action integration tests
- `tests/actions/audit-authorization.test.ts` - Permission enforcement tests

### Analytics Tests

- `tests/services/analytics.service.test.ts` - Metric calculation tests
- `tests/actions/analytics-action.test.ts` - Permission and action tests

Run tests: `npm run test` or `npm run test:ci`

## Security Considerations

1. **Permission Enforcement**: All admin actions require explicit permission checks via `requirePermission()`
2. **Audit Trail**: All privileged actions are automatically logged with actor ID, timestamp, and result status
3. **Error Masking**: Audit logs include error details for debugging but don't expose sensitive data to clients
4. **Role Isolation**: Permissions are strictly defined per role; no permission escalation is possible
5. **Analytics Access**: Only authorized roles can view analytics (viewAnalytics permission)

## Future Enhancements

- [ ] Time-series analytics (daily registrations, exam attempts trends)
- [ ] Custom report builder
- [ ] Audit log export (CSV, PDF)
- [ ] Real-time dashboard updates with WebSocket
- [ ] Advanced filtering and search in audit logs
- [ ] Analytics data visualization library integration
- [ ] Student performance analytics by demographic
- [ ] Content performance metrics (most/least used modules)
- [ ] Question performance analytics (difficulty calibration)

## Deployment Notes

- Analytics dashboard does not cache results; each page load recalculates metrics from current database state
- Audit logs are immutable once written
- Permissions are evaluated at request time; role changes take effect immediately
- All admin actions require valid JWT session (NextAuth)

## Support

For issues with:
- **Audit logging**: Check [server/services/audit-log.service.ts](server/services/audit-log.service.ts) and test coverage
- **Analytics accuracy**: Verify repository methods in [server/services/analytics.service.ts](server/services/analytics.service.ts)
- **Permissions**: Review role definitions in [server/services/permission.service.ts](server/services/permission.service.ts)
- **UI issues**: Check component tests in `tests/components/` and browser console
