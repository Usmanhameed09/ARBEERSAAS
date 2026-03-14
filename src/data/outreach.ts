export interface CallLog {
  id: string;
  contractorName: string;
  contractorCompany: string;
  contractTitle: string;
  opportunityId: string;
  duration: string;
  date: string;
  time: string;
  outcome: "Interested" | "Not Available" | "Voicemail" | "Declined" | "Follow-up";
  summary: string;
  phoneNumber: string;
}

export interface SentEmail {
  id: string;
  to: string;
  toCompany: string;
  subject: string;
  contractTitle: string;
  opportunityId: string;
  date: string;
  time: string;
  status: "Delivered" | "Opened" | "Replied" | "Bounced";
  hasAttachments: boolean;
  attachmentCount: number;
}

export interface OutreachSettings {
  email: {
    imapServer: string;
    imapPort: string;
    smtpServer: string;
    smtpPort: string;
    email: string;
    connected: boolean;
  };
  vapi: {
    apiKey: string;
    assistantId: string;
    phoneNumber: string;
    connected: boolean;
  };
}

export const callLogs: CallLog[] = [
  {
    id: "cl1",
    contractorName: "Marcus Johnson",
    contractorCompany: "Elite Disaster Pros",
    contractTitle: "FEMA Debris Removal - Hurricane Recovery",
    opportunityId: "opp1",
    duration: "3:42",
    date: "2026-03-05",
    time: "10:15 AM",
    outcome: "Interested",
    summary:
      "Called Marcus regarding the FEMA debris removal contract in Savannah. He confirmed availability and team capacity for the project timeline. Asked him to review the full RFP and pricing sheet sent via email. He will submit pricing by Friday.",
    phoneNumber: "(912) 555-0134",
  },
  {
    id: "cl2",
    contractorName: "David Chen",
    contractorCompany: "Apex Electric",
    contractTitle: "VA Medical Center Electrical Upgrade",
    opportunityId: "opp2",
    duration: "2:18",
    date: "2026-03-05",
    time: "11:30 AM",
    outcome: "Interested",
    summary:
      "Reached David about the VA electrical upgrade project. He expressed strong interest and has relevant past performance. Directed him to check email for full SOW and attachment. Will provide quote within 48 hours.",
    phoneNumber: "(404) 555-0278",
  },
  {
    id: "cl3",
    contractorName: "Patricia Adams",
    contractorCompany: "HeavyEquip Co.",
    contractTitle: "Army Base Infrastructure Repair",
    opportunityId: "opp3",
    duration: "1:55",
    date: "2026-03-04",
    time: "2:45 PM",
    outcome: "Follow-up",
    summary:
      "Spoke with Patricia about equipment rental needs for the Army base project. She needs to check heavy equipment availability for the proposed dates. Will call back tomorrow with confirmation.",
    phoneNumber: "(770) 555-0567",
  },
  {
    id: "cl4",
    contractorName: "Anthony Brown",
    contractorCompany: "Metro Security Inc.",
    contractTitle: "Federal Courthouse Security Services",
    opportunityId: "opp4",
    duration: "4:12",
    date: "2026-03-04",
    time: "9:00 AM",
    outcome: "Interested",
    summary:
      "Anthony confirmed Metro Security can provide the required personnel for the courthouse contract. Discussed clearance requirements and he confirmed all staff have active clearances. Email with full details sent.",
    phoneNumber: "(404) 555-0345",
  },
  {
    id: "cl5",
    contractorName: "Robert Taylor",
    contractorCompany: "Swift HVAC",
    contractTitle: "GSA Building HVAC Modernization",
    opportunityId: "opp5",
    duration: "1:02",
    date: "2026-03-03",
    time: "3:30 PM",
    outcome: "Not Available",
    summary:
      "Called Robert about the GSA HVAC project. He indicated Swift HVAC is currently at full capacity with existing contracts and cannot take on new work until May. Noted for future opportunities.",
    phoneNumber: "(478) 555-0234",
  },
  {
    id: "cl6",
    contractorName: "James Rivera",
    contractorCompany: "Apex Roofing",
    contractTitle: "Military Housing Roofing Replacement",
    opportunityId: "opp6",
    duration: "0:45",
    date: "2026-03-03",
    time: "10:00 AM",
    outcome: "Voicemail",
    summary:
      "Left voicemail for James regarding the military housing roofing contract. Provided brief summary and asked him to check email for full details. Will follow up tomorrow if no response.",
    phoneNumber: "(706) 555-0445",
  },
  {
    id: "cl7",
    contractorName: "Sandra Williams",
    contractorCompany: "AllStar Workers",
    contractTitle: "FEMA Debris Removal - Hurricane Recovery",
    opportunityId: "opp1",
    duration: "2:30",
    date: "2026-03-02",
    time: "1:15 PM",
    outcome: "Interested",
    summary:
      "Sandra confirmed AllStar Workers can provide labor crew for the debris removal project. Discussed crew size requirements and mobilization timeline. She will review email attachments and send pricing by end of week.",
    phoneNumber: "(404) 555-0891",
  },
  {
    id: "cl8",
    contractorName: "Lisa Nguyen",
    contractorCompany: "TechNet Solutions",
    contractTitle: "DOD Network Infrastructure Upgrade",
    opportunityId: "opp7",
    duration: "1:15",
    date: "2026-03-01",
    time: "4:00 PM",
    outcome: "Declined",
    summary:
      "Lisa declined participation in the DOD network project due to expired insurance certifications. She mentioned renewal is in process but won't be ready for 3-4 weeks. Not viable for this timeline.",
    phoneNumber: "(770) 555-0123",
  },
];

export const sentEmails: SentEmail[] = [
  {
    id: "em1",
    to: "marcus@elitedisaster.com",
    toCompany: "Elite Disaster Pros",
    subject: "RFP: FEMA Debris Removal - Hurricane Recovery | Pricing Request",
    contractTitle: "FEMA Debris Removal - Hurricane Recovery",
    opportunityId: "opp1",
    date: "2026-03-05",
    time: "10:18 AM",
    status: "Opened",
    hasAttachments: true,
    attachmentCount: 3,
  },
  {
    id: "em2",
    to: "dchen@apexelectric.com",
    toCompany: "Apex Electric",
    subject: "RFP: VA Medical Center Electrical Upgrade | Quote Needed",
    contractTitle: "VA Medical Center Electrical Upgrade",
    opportunityId: "opp2",
    date: "2026-03-05",
    time: "11:33 AM",
    status: "Opened",
    hasAttachments: true,
    attachmentCount: 2,
  },
  {
    id: "em3",
    to: "padams@heavyequip.com",
    toCompany: "HeavyEquip Co.",
    subject: "RFP: Army Base Infrastructure Repair | Equipment Rental Quote",
    contractTitle: "Army Base Infrastructure Repair",
    opportunityId: "opp3",
    date: "2026-03-04",
    time: "2:48 PM",
    status: "Delivered",
    hasAttachments: true,
    attachmentCount: 4,
  },
  {
    id: "em4",
    to: "abrown@metrosecurity.com",
    toCompany: "Metro Security Inc.",
    subject: "RFP: Federal Courthouse Security Services | Pricing Request",
    contractTitle: "Federal Courthouse Security Services",
    opportunityId: "opp4",
    date: "2026-03-04",
    time: "9:05 AM",
    status: "Replied",
    hasAttachments: true,
    attachmentCount: 2,
  },
  {
    id: "em5",
    to: "swilliams@allstarworkers.com",
    toCompany: "AllStar Workers",
    subject: "RFP: FEMA Debris Removal | Labor Crew Pricing Request",
    contractTitle: "FEMA Debris Removal - Hurricane Recovery",
    opportunityId: "opp1",
    date: "2026-03-02",
    time: "1:18 PM",
    status: "Opened",
    hasAttachments: true,
    attachmentCount: 3,
  },
  {
    id: "em6",
    to: "jrivera@apexroofing.com",
    toCompany: "Apex Roofing",
    subject: "RFP: Military Housing Roofing Replacement | Quote Request",
    contractTitle: "Military Housing Roofing Replacement",
    opportunityId: "opp6",
    date: "2026-03-03",
    time: "10:02 AM",
    status: "Delivered",
    hasAttachments: true,
    attachmentCount: 2,
  },
  {
    id: "em7",
    to: "lnguyen@technet.com",
    toCompany: "TechNet Solutions",
    subject: "RFP: DOD Network Infrastructure Upgrade | Participation Request",
    contractTitle: "DOD Network Infrastructure Upgrade",
    opportunityId: "opp7",
    date: "2026-03-01",
    time: "4:03 PM",
    status: "Bounced",
    hasAttachments: true,
    attachmentCount: 2,
  },
];
