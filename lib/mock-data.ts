// Mock data for testing without database integration

export const mockStudents = [
  {
    id: "1",
    email: "john.doe@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    schoolId: "1",
    schoolName: "Harvard University",
    verificationStatus: "pending" as const,
    interviewStatus: "not_started" as const,
    invitationToken: "abc123",
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Smith",
    schoolId: "1",
    schoolName: "Harvard University",
    verificationStatus: "approved" as const,
    interviewStatus: "not_started" as const,
    invitationToken: "def456",
  },
  {
    id: "3",
    email: "test@student.com",
    password: "test123",
    firstName: "Test",
    lastName: "Student",
    schoolId: "2",
    schoolName: "MIT",
    verificationStatus: "pending" as const,
    interviewStatus: "not_started" as const,
    invitationToken: "ghi789",
  },
]

export const mockSchools = [
  {
    id: "1",
    email: "admin@harvard.edu",
    password: "school123",
    name: "Harvard University",
    contactName: "Admin User",
    credits: 50,
  },
  {
    id: "2",
    email: "admin@mit.edu",
    password: "school123",
    name: "MIT",
    contactName: "MIT Admin",
    credits: 100,
  },
]
