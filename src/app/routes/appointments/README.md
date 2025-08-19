# Appointments Dashboard

A complete appointments dashboard implementation for the ClickX medical application featuring a responsive sidebar with today's appointments and patient details view.

## Components Overview

### AppointmentsDashboardComponent (`appointments-dashboard.component.ts`)
Main dashboard container component that:
- Uses Material Sidenav layout with 20% sidebar width
- Displays today's appointments in the left sidebar
- Shows patient details (80% width) on the right
- Handles appointment selection and patient ID passing
- Supports both light and dark themes
- Includes responsive design for mobile devices

### AppointmentsListComponent (`appointments-list.component.ts`)
Sidebar component that:
- Fetches today's appointments using `AppointmentsService.getTodayAppointments()`
- Displays appointments in Material cards with:
  - Patient name and public ID
  - Appointment time (start-end)
  - Appointment type and practitioner
  - Status badge with appropriate colors
  - Financial alert indicator
  - Gender icon
  - Phone number (if available)
- Implements click handling to select appointments
- Shows loading, error, and empty states
- Includes appointment summary statistics

## Features

### Responsive Design
- **Desktop/Tablet**: 20% sidebar, 80% patient details
- **Mobile**: Full-width sidebar that can be toggled
- Proper touch targets and mobile-optimized spacing

### Material Design Integration
- Uses Angular Material components throughout
- Follows the medical theme with teal primary colors
- Supports light/dark theme switching
- Proper accessibility attributes and ARIA labels

### Angular Signals API
- All components use the new Signals API for reactive state management
- Computed properties for derived state (appointment counts, filtering)
- Effects for handling resource state changes

### Internationalization Support
- All text content uses TranslateModule
- RTL support with proper directional layouts
- Localized date/time formatting

### Error Handling & Loading States
- Loading spinners during data fetching
- Error messages with retry functionality
- Empty state when no appointments exist
- Fallback mock data for development

## Usage

### Routing
The dashboard is accessible at `/appointments` or `/appointments/dashboard`:

```typescript
// Navigate to appointments dashboard
this.router.navigate(['/appointments']);
```

### API Integration
Uses `AppointmentsService.getTodayAppointments()` which:
- Returns appointments based on user role
- DOCTOR: Only their own appointments
- NURSE/ASSISTANT/ADMIN: All appointments for today

### Theme Integration
Follows the medical theme defined in `src/styles/medical-theme.scss`:
- Primary color: `--med-primary-dark` (#0C4C43 - dark teal)
- Success color: `--med-success` (#1E8F60 - medical green)
- Error/Warning colors for status indicators

## File Structure

```
src/app/routes/appointments/
├── appointments-dashboard.component.ts
├── appointments-dashboard.component.html
├── appointments-dashboard.component.scss
├── appointments-dashboard.component.spec.ts
├── appointments-list/
│   ├── appointments-list.component.ts
│   ├── appointments-list.component.html
│   ├── appointments-list.component.scss
│   └── appointments-list.component.spec.ts
├── routes.ts
├── index.ts
└── README.md
```

## Translation Keys Required

Add these keys to your translation files:

```json
{
  "appointments": {
    "dashboard": "Appointments Dashboard",
    "todaysAppointments": "Today's Appointments",
    "selectAppointment": "Select an appointment",
    "selectAppointmentHint": "Choose an appointment from the sidebar to view patient details",
    "loadingAppointments": "Loading appointments...",
    "noAppointments": "No Appointments",
    "noAppointmentsToday": "There are no appointments scheduled for today",
    "total": "Total",
    "upcoming": "Upcoming",
    "financialAlert": "Financial alert for this patient"
  },
  "appointmentStatus": {
    "SCHEDULED": "Scheduled",
    "CONFIRMED": "Confirmed", 
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
    "NO_SHOW": "No Show",
    "RESCHEDULED": "Rescheduled"
  },
  "common": {
    "error": "Error",
    "retry": "Retry",
    "toggleSidebar": "Toggle sidebar"
  }
}
```

## Testing

Run tests for the appointments components:

```bash
npm run test -- --include='**/appointments/**/*.spec.ts'
```

## Development

Start the development server to see the dashboard in action:

```bash
npm start
```

Navigate to `http://localhost:4200/appointments` to view the dashboard.

## Integration Notes

- The dashboard automatically integrates with the existing patient details component
- Uses the same medical theme variables as the rest of the application
- Follows the project's Angular 20 standalone component pattern
- Compatible with the existing authentication and routing system
