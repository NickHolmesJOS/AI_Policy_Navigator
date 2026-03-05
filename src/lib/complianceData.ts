import type { ComplianceFramework, ComplianceRule } from "@/types";

// ─── Built-in Compliance Frameworks ────────────────────────────────────────

export const BUILT_IN_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: "gdpr",
    name: "General Data Protection Regulation",
    shortName: "GDPR",
    color: "bg-blue-500",
    description:
      "EU regulation on data protection and privacy for all individuals within the European Union and the European Economic Area.",
    isBuiltIn: true,
  },
  {
    id: "hipaa",
    name: "Health Insurance Portability and Accountability Act",
    shortName: "HIPAA",
    color: "bg-emerald-500",
    description:
      "US federal law that sets standards for the protection of sensitive patient health information.",
    isBuiltIn: true,
  },
  {
    id: "soc2",
    name: "Service Organization Control 2",
    shortName: "SOC 2",
    color: "bg-violet-500",
    description:
      "Auditing framework developed by the AICPA for managing customer data based on five trust service criteria.",
    isBuiltIn: true,
  },
  {
    id: "pci-dss",
    name: "Payment Card Industry Data Security Standard",
    shortName: "PCI DSS",
    color: "bg-amber-500",
    description:
      "Information security standard for organizations that handle branded credit cards from major card schemes.",
    isBuiltIn: true,
  },
  {
    id: "iso27001",
    name: "ISO/IEC 27001 Information Security Management",
    shortName: "ISO 27001",
    color: "bg-cyan-500",
    description:
      "International standard for managing information security through an Information Security Management System (ISMS).",
    isBuiltIn: true,
  },
  {
    id: "ccpa",
    name: "California Consumer Privacy Act",
    shortName: "CCPA",
    color: "bg-orange-500",
    description:
      "California state statute enhancing privacy rights and consumer protection for residents of California.",
    isBuiltIn: true,
  },
];

// ─── Built-in Compliance Rules with Real Regulatory References ─────────────

const ts = "2024-01-01T00:00:00.000Z"; // static timestamp for built-in rules

export const BUILT_IN_RULES: ComplianceRule[] = [
  // ── GDPR ─────────────────────────────────────────────────────────────────
  {
    id: "gdpr-1",
    frameworkId: "gdpr",
    title: "Lawful Basis for Processing",
    description:
      "Policy must specify the legal basis for each data processing activity — consent, contract performance, legal obligation, vital interests, public task, or legitimate interests.",
    section: "Article 6",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["lawful basis", "legal basis", "processing", "consent", "legitimate interest", "contract"],
    createdAt: ts,
  },
  {
    id: "gdpr-2",
    frameworkId: "gdpr",
    title: "Data Subject Consent Requirements",
    description:
      "Policy must describe how valid consent is obtained, recorded, and managed. Consent must be freely given, specific, informed, and unambiguous. Must include mechanism for withdrawal.",
    section: "Article 7",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["consent", "freely given", "withdrawal", "opt-in", "data subject"],
    createdAt: ts,
  },
  {
    id: "gdpr-3",
    frameworkId: "gdpr",
    title: "Right of Access by Data Subject",
    description:
      "Policy must address the right of data subjects to obtain confirmation of whether personal data is being processed, and access to that data within one month of request.",
    section: "Article 15",
    severity: "high",
    isBuiltIn: true,
    keywords: ["right to access", "data subject request", "SAR", "subject access"],
    createdAt: ts,
  },
  {
    id: "gdpr-4",
    frameworkId: "gdpr",
    title: "Right to Erasure (Right to Be Forgotten)",
    description:
      "Policy must include provisions for erasing personal data without undue delay when data is no longer necessary, consent is withdrawn, or data was unlawfully processed.",
    section: "Article 17",
    severity: "high",
    isBuiltIn: true,
    keywords: ["right to erasure", "right to be forgotten", "deletion", "erase"],
    createdAt: ts,
  },
  {
    id: "gdpr-5",
    frameworkId: "gdpr",
    title: "Data Breach Notification",
    description:
      "Policy must describe procedures for notifying the supervisory authority within 72 hours of becoming aware of a personal data breach, and notifying affected data subjects without undue delay.",
    section: "Articles 33–34",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["data breach", "notification", "72 hours", "supervisory authority", "breach response"],
    createdAt: ts,
  },
  {
    id: "gdpr-6",
    frameworkId: "gdpr",
    title: "Data Protection Officer Designation",
    description:
      "Policy must identify the Data Protection Officer or explain why one is not required. A DPO is mandatory for public authorities and organizations performing large-scale systematic monitoring.",
    section: "Articles 37–39",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["data protection officer", "DPO", "privacy officer"],
    createdAt: ts,
  },
  {
    id: "gdpr-7",
    frameworkId: "gdpr",
    title: "Data Protection Impact Assessment",
    description:
      "Policy must address requirements for conducting a DPIA before processing that is likely to result in a high risk to data subjects' rights and freedoms.",
    section: "Article 35",
    severity: "high",
    isBuiltIn: true,
    keywords: ["impact assessment", "DPIA", "privacy impact", "risk assessment", "high risk"],
    createdAt: ts,
  },
  {
    id: "gdpr-8",
    frameworkId: "gdpr",
    title: "Cross-Border Data Transfer Safeguards",
    description:
      "Policy must address safeguards for transferring personal data outside the EU/EEA, including adequacy decisions, Standard Contractual Clauses (SCCs), or Binding Corporate Rules.",
    section: "Articles 44–49",
    severity: "high",
    isBuiltIn: true,
    keywords: ["cross-border", "data transfer", "adequacy", "standard contractual clauses", "SCC", "binding corporate rules"],
    createdAt: ts,
  },
  {
    id: "gdpr-9",
    frameworkId: "gdpr",
    title: "Data Minimization Principle",
    description:
      "Policy must describe practices ensuring personal data collected is adequate, relevant, and limited to what is necessary for the specified processing purposes.",
    section: "Article 5(1)(c)",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["data minimization", "adequate", "relevant", "limited", "necessary"],
    createdAt: ts,
  },
  {
    id: "gdpr-10",
    frameworkId: "gdpr",
    title: "Storage Limitation & Retention Periods",
    description:
      "Policy must define data retention periods and ensure personal data is kept in identifiable form for no longer than necessary for its processing purpose.",
    section: "Article 5(1)(e)",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["retention", "storage limitation", "retention period", "data lifecycle", "deletion schedule"],
    createdAt: ts,
  },

  // ── HIPAA ────────────────────────────────────────────────────────────────
  {
    id: "hipaa-1",
    frameworkId: "hipaa",
    title: "PHI Identification & Safeguards",
    description:
      "Policy must define what constitutes Protected Health Information (PHI) and describe administrative, physical, and technical safeguards to protect its confidentiality, integrity, and availability.",
    section: "§164.530",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["PHI", "protected health information", "safeguards", "health data", "ePHI"],
    createdAt: ts,
  },
  {
    id: "hipaa-2",
    frameworkId: "hipaa",
    title: "Administrative Safeguards",
    description:
      "Policy must describe administrative actions including security management processes, assigned security responsibility, workforce security, information access management, and security awareness training.",
    section: "§164.308",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["administrative safeguards", "security management", "workforce security", "security officer", "contingency plan"],
    createdAt: ts,
  },
  {
    id: "hipaa-3",
    frameworkId: "hipaa",
    title: "Physical Safeguards",
    description:
      "Policy must address physical access controls to facilities and workstations, device and media controls including disposal and re-use of electronic media containing ePHI.",
    section: "§164.310",
    severity: "high",
    isBuiltIn: true,
    keywords: ["physical safeguards", "facility access", "workstation security", "device controls", "media disposal"],
    createdAt: ts,
  },
  {
    id: "hipaa-4",
    frameworkId: "hipaa",
    title: "Technical Safeguards",
    description:
      "Policy must address access controls (unique user ID, emergency access, automatic logoff, encryption/decryption), audit controls, integrity controls, and transmission security.",
    section: "§164.312",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["technical safeguards", "access control", "audit controls", "encryption", "integrity", "transmission security"],
    createdAt: ts,
  },
  {
    id: "hipaa-5",
    frameworkId: "hipaa",
    title: "Business Associate Agreements",
    description:
      "Policy must require written Business Associate Agreements (BAAs) with all third parties that create, receive, maintain, or transmit PHI on the organization's behalf.",
    section: "§164.502(e)",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["business associate", "BAA", "third party", "subcontractor", "vendor agreement"],
    createdAt: ts,
  },
  {
    id: "hipaa-6",
    frameworkId: "hipaa",
    title: "Breach Notification Rule",
    description:
      "Policy must describe procedures for notifying affected individuals within 60 days, HHS for breaches affecting 500+ individuals, and prominent media outlets for large breaches.",
    section: "§164.400–414",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["breach notification", "reporting", "HHS notification", "individual notice"],
    createdAt: ts,
  },
  {
    id: "hipaa-7",
    frameworkId: "hipaa",
    title: "Patient Access Rights",
    description:
      "Policy must address patients' right to access, inspect, and obtain a copy of their PHI maintained in designated record sets, with response within 30 days.",
    section: "§164.524",
    severity: "high",
    isBuiltIn: true,
    keywords: ["patient rights", "access to records", "designated record set", "copy of PHI"],
    createdAt: ts,
  },
  {
    id: "hipaa-8",
    frameworkId: "hipaa",
    title: "Minimum Necessary Standard",
    description:
      "Policy must implement the minimum necessary standard, limiting use, disclosure, and requests for PHI to the minimum amount necessary to accomplish the intended purpose.",
    section: "§164.502(b)",
    severity: "high",
    isBuiltIn: true,
    keywords: ["minimum necessary", "need to know", "limited access", "role-based"],
    createdAt: ts,
  },
  {
    id: "hipaa-9",
    frameworkId: "hipaa",
    title: "Security Risk Analysis",
    description:
      "Policy must require periodic, thorough assessments of potential risks and vulnerabilities to the confidentiality, integrity, and availability of all ePHI.",
    section: "§164.308(a)(1)(ii)(A)",
    severity: "high",
    isBuiltIn: true,
    keywords: ["risk analysis", "risk assessment", "vulnerability assessment", "security evaluation"],
    createdAt: ts,
  },
  {
    id: "hipaa-10",
    frameworkId: "hipaa",
    title: "Workforce Training & Awareness",
    description:
      "Policy must require security awareness training for all workforce members, including procedures for guarding against and detecting malicious software and login monitoring.",
    section: "§164.308(a)(5)",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["training", "security awareness", "workforce training", "education"],
    createdAt: ts,
  },

  // ── SOC 2 ────────────────────────────────────────────────────────────────
  {
    id: "soc2-1",
    frameworkId: "soc2",
    title: "Security Policy Documentation",
    description:
      "Organization must maintain formal, documented information security policies that are communicated to all personnel and reviewed at least annually.",
    section: "CC1.1",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["security policy", "documentation", "information security", "policy statement"],
    createdAt: ts,
  },
  {
    id: "soc2-2",
    frameworkId: "soc2",
    title: "Logical Access Controls",
    description:
      "Policy must describe logical access controls including authentication mechanisms, role-based access, privilege management, and access provisioning/de-provisioning procedures.",
    section: "CC6.1",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["access control", "authentication", "role-based", "provisioning", "MFA", "multi-factor"],
    createdAt: ts,
  },
  {
    id: "soc2-3",
    frameworkId: "soc2",
    title: "Change Management Procedures",
    description:
      "Policy must describe formal change management processes including change requests, approval workflows, testing, and documentation for infrastructure and application changes.",
    section: "CC8.1",
    severity: "high",
    isBuiltIn: true,
    keywords: ["change management", "change control", "approval", "deployment", "release management"],
    createdAt: ts,
  },
  {
    id: "soc2-4",
    frameworkId: "soc2",
    title: "Risk Assessment Methodology",
    description:
      "Policy must describe the risk assessment process including identification of threats, likelihood analysis, impact assessment, and risk treatment plans.",
    section: "CC3.1",
    severity: "high",
    isBuiltIn: true,
    keywords: ["risk assessment", "threat identification", "risk treatment", "likelihood", "impact"],
    createdAt: ts,
  },
  {
    id: "soc2-5",
    frameworkId: "soc2",
    title: "Incident Response Plan",
    description:
      "Policy must define incident response procedures including detection, analysis, containment, eradication, recovery, and post-incident review processes.",
    section: "CC7.3",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["incident response", "incident management", "containment", "recovery", "post-incident"],
    createdAt: ts,
  },
  {
    id: "soc2-6",
    frameworkId: "soc2",
    title: "Vendor & Third-Party Risk Management",
    description:
      "Policy must address vendor risk assessment, due diligence, contractual security requirements, and ongoing monitoring of third-party service providers.",
    section: "CC9.2",
    severity: "high",
    isBuiltIn: true,
    keywords: ["vendor management", "third-party risk", "due diligence", "supply chain", "subprocessor"],
    createdAt: ts,
  },
  {
    id: "soc2-7",
    frameworkId: "soc2",
    title: "Data Classification & Handling",
    description:
      "Policy must define data classification levels (e.g., public, internal, confidential, restricted) and specify handling, storage, transmission, and disposal requirements for each level.",
    section: "CC6.7",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["data classification", "confidential", "restricted", "handling", "labeling"],
    createdAt: ts,
  },
  {
    id: "soc2-8",
    frameworkId: "soc2",
    title: "System Monitoring & Logging",
    description:
      "Policy must describe system monitoring, event logging, log retention, and alerting mechanisms to detect anomalies, unauthorized access, and security events.",
    section: "CC7.2",
    severity: "high",
    isBuiltIn: true,
    keywords: ["monitoring", "logging", "audit trail", "alerting", "SIEM", "event log"],
    createdAt: ts,
  },
  {
    id: "soc2-9",
    frameworkId: "soc2",
    title: "Business Continuity & Disaster Recovery",
    description:
      "Policy must define business continuity plans, disaster recovery procedures, RTO/RPO targets, backup strategies, and regular testing of recovery capabilities.",
    section: "A1.2",
    severity: "high",
    isBuiltIn: true,
    keywords: ["business continuity", "disaster recovery", "BCP", "DRP", "backup", "RTO", "RPO"],
    createdAt: ts,
  },
  {
    id: "soc2-10",
    frameworkId: "soc2",
    title: "Encryption Standards",
    description:
      "Policy must specify encryption requirements for data at rest and in transit, including acceptable algorithms, key lengths, and key management procedures.",
    section: "CC6.1",
    severity: "high",
    isBuiltIn: true,
    keywords: ["encryption", "AES", "TLS", "key management", "data at rest", "data in transit"],
    createdAt: ts,
  },

  // ── PCI DSS ──────────────────────────────────────────────────────────────
  {
    id: "pci-1",
    frameworkId: "pci-dss",
    title: "Network Segmentation & Firewall Rules",
    description:
      "Policy must describe firewall and router configurations that restrict connections between untrusted networks and the cardholder data environment (CDE).",
    section: "Requirement 1",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["firewall", "network segmentation", "CDE", "cardholder data environment", "router"],
    createdAt: ts,
  },
  {
    id: "pci-2",
    frameworkId: "pci-dss",
    title: "Secure System Configuration",
    description:
      "Policy must address changing vendor-supplied defaults, removing unnecessary services, and implementing security-hardened configurations on all system components.",
    section: "Requirement 2",
    severity: "high",
    isBuiltIn: true,
    keywords: ["default password", "system hardening", "vendor defaults", "secure configuration"],
    createdAt: ts,
  },
  {
    id: "pci-3",
    frameworkId: "pci-dss",
    title: "Stored Cardholder Data Protection",
    description:
      "Policy must describe protection of stored cardholder data including truncation, masking, hashing, and encryption. Must define retention and disposal requirements.",
    section: "Requirement 3",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["stored data", "cardholder data", "PAN", "masking", "truncation", "retention"],
    createdAt: ts,
  },
  {
    id: "pci-4",
    frameworkId: "pci-dss",
    title: "Encryption of Cardholder Data in Transit",
    description:
      "Policy must require strong cryptography for transmission of cardholder data across open, public networks (e.g., TLS 1.2+, IPsec).",
    section: "Requirement 4",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["encryption in transit", "TLS", "cryptography", "transmission", "open network"],
    createdAt: ts,
  },
  {
    id: "pci-5",
    frameworkId: "pci-dss",
    title: "Anti-Malware & Anti-Virus Protection",
    description:
      "Policy must address deployment and maintenance of anti-virus/anti-malware solutions on all systems commonly affected by malicious software.",
    section: "Requirement 5",
    severity: "high",
    isBuiltIn: true,
    keywords: ["anti-malware", "anti-virus", "malware", "virus protection", "endpoint protection"],
    createdAt: ts,
  },
  {
    id: "pci-6",
    frameworkId: "pci-dss",
    title: "Secure Software Development",
    description:
      "Policy must address secure coding practices, code reviews, vulnerability testing, and change control procedures for all custom and third-party software.",
    section: "Requirement 6",
    severity: "high",
    isBuiltIn: true,
    keywords: ["secure development", "SDLC", "code review", "vulnerability", "patching", "web application firewall"],
    createdAt: ts,
  },
  {
    id: "pci-7",
    frameworkId: "pci-dss",
    title: "Access Restriction by Business Need-to-Know",
    description:
      "Policy must restrict access to cardholder data to only those individuals whose job requires such access, with documented access control lists.",
    section: "Requirement 7",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["need-to-know", "access restriction", "least privilege", "access control list"],
    createdAt: ts,
  },
  {
    id: "pci-8",
    frameworkId: "pci-dss",
    title: "Unique User Identification & Authentication",
    description:
      "Policy must assign unique IDs to each person with computer access, implement multi-factor authentication for remote access, and enforce strong password policies.",
    section: "Requirement 8",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["unique ID", "user authentication", "MFA", "multi-factor", "password policy"],
    createdAt: ts,
  },
  {
    id: "pci-9",
    frameworkId: "pci-dss",
    title: "Physical Access Restriction",
    description:
      "Policy must restrict physical access to cardholder data, including visitor controls, media protection, and point-of-sale device security.",
    section: "Requirement 9",
    severity: "high",
    isBuiltIn: true,
    keywords: ["physical access", "visitor log", "media protection", "POS device", "facility access"],
    createdAt: ts,
  },
  {
    id: "pci-10",
    frameworkId: "pci-dss",
    title: "Logging, Monitoring & Regular Testing",
    description:
      "Policy must describe audit trail mechanisms for all access to cardholder data, regular security testing (penetration tests, vulnerability scans), and log review procedures.",
    section: "Requirements 10–11",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["audit trail", "logging", "monitoring", "penetration test", "vulnerability scan", "log review"],
    createdAt: ts,
  },

  // ── ISO 27001 ────────────────────────────────────────────────────────────
  {
    id: "iso-1",
    frameworkId: "iso27001",
    title: "Information Security Policy Statement",
    description:
      "Organization must establish and maintain an Information Security Management System (ISMS) policy appropriate to its purpose, providing a framework for setting security objectives.",
    section: "Annex A.5",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["ISMS", "security policy", "management commitment", "policy statement"],
    createdAt: ts,
  },
  {
    id: "iso-2",
    frameworkId: "iso27001",
    title: "Security Roles & Responsibilities",
    description:
      "Policy must define and allocate information security responsibilities, including the establishment of segregation of duties where appropriate.",
    section: "Annex A.6",
    severity: "high",
    isBuiltIn: true,
    keywords: ["roles", "responsibilities", "segregation of duties", "security organization", "CISO"],
    createdAt: ts,
  },
  {
    id: "iso-3",
    frameworkId: "iso27001",
    title: "Asset Management & Inventory",
    description:
      "Policy must require identification and classification of information assets, assignment of asset owners, and acceptable use rules.",
    section: "Annex A.8",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["asset management", "asset inventory", "asset owner", "classification", "acceptable use"],
    createdAt: ts,
  },
  {
    id: "iso-4",
    frameworkId: "iso27001",
    title: "Access Control Policy",
    description:
      "Policy must define access control rules based on business and security requirements, including user access provisioning, privilege management, and authentication.",
    section: "Annex A.9",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["access control", "user provisioning", "privilege management", "authentication", "authorization"],
    createdAt: ts,
  },
  {
    id: "iso-5",
    frameworkId: "iso27001",
    title: "Cryptographic Controls",
    description:
      "Policy must address the use of cryptographic controls for protection of information, including key management lifecycle procedures.",
    section: "Annex A.10",
    severity: "high",
    isBuiltIn: true,
    keywords: ["cryptography", "encryption", "key management", "digital signature", "certificate"],
    createdAt: ts,
  },
  {
    id: "iso-6",
    frameworkId: "iso27001",
    title: "Physical & Environmental Security",
    description:
      "Policy must address security perimeters, physical entry controls, protection against external and environmental threats, and equipment security.",
    section: "Annex A.11",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["physical security", "environmental security", "secure areas", "equipment", "cabling"],
    createdAt: ts,
  },
  {
    id: "iso-7",
    frameworkId: "iso27001",
    title: "Operations Security",
    description:
      "Policy must describe operational procedures including malware protection, backup, logging and monitoring, software installation controls, and vulnerability management.",
    section: "Annex A.12",
    severity: "high",
    isBuiltIn: true,
    keywords: ["operations security", "backup", "malware protection", "capacity management", "vulnerability management"],
    createdAt: ts,
  },
  {
    id: "iso-8",
    frameworkId: "iso27001",
    title: "Communications Security",
    description:
      "Policy must address network security management, segregation in networks, information transfer policies, and agreements on information exchange.",
    section: "Annex A.13",
    severity: "high",
    isBuiltIn: true,
    keywords: ["network security", "communications security", "information transfer", "segregation"],
    createdAt: ts,
  },
  {
    id: "iso-9",
    frameworkId: "iso27001",
    title: "Supplier Relationship Security",
    description:
      "Policy must address information security in supplier relationships, including supply chain risk management, monitoring and review of supplier services.",
    section: "Annex A.15",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["supplier security", "vendor management", "supply chain", "third party", "outsourcing"],
    createdAt: ts,
  },
  {
    id: "iso-10",
    frameworkId: "iso27001",
    title: "Security Incident Management",
    description:
      "Policy must define procedures for reporting, assessing, responding to, and learning from information security events and incidents.",
    section: "Annex A.16",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["incident management", "security event", "incident response", "forensics", "lessons learned"],
    createdAt: ts,
  },

  // ── CCPA ─────────────────────────────────────────────────────────────────
  {
    id: "ccpa-1",
    frameworkId: "ccpa",
    title: "Right to Know About Data Collection",
    description:
      "Policy must disclose the categories of personal information collected, the sources, the business purpose for collection, and the categories of third parties with whom data is shared.",
    section: "§1798.100",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["right to know", "disclosure", "categories of information", "data collection"],
    createdAt: ts,
  },
  {
    id: "ccpa-2",
    frameworkId: "ccpa",
    title: "Right to Delete Personal Information",
    description:
      "Policy must describe how consumers can request deletion of personal information and the process for fulfilling such requests, including exceptions.",
    section: "§1798.105",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["right to delete", "deletion request", "consumer request", "erasure"],
    createdAt: ts,
  },
  {
    id: "ccpa-3",
    frameworkId: "ccpa",
    title: "Right to Opt-Out of Sale of Data",
    description:
      "Policy must provide a clear 'Do Not Sell My Personal Information' mechanism and describe the process for consumers to opt out of the sale of their personal information.",
    section: "§1798.120",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["opt-out", "do not sell", "sale of data", "opt out"],
    createdAt: ts,
  },
  {
    id: "ccpa-4",
    frameworkId: "ccpa",
    title: "Non-Discrimination for Exercising Rights",
    description:
      "Policy must state that consumers will not face discrimination (price differences, service level reduction) for exercising their CCPA rights.",
    section: "§1798.125",
    severity: "high",
    isBuiltIn: true,
    keywords: ["non-discrimination", "equal service", "no penalty", "consumer rights"],
    createdAt: ts,
  },
  {
    id: "ccpa-5",
    frameworkId: "ccpa",
    title: "Privacy Notice at Collection",
    description:
      "Policy must provide notice at or before the point of collection informing consumers of the categories of personal information to be collected and the purposes.",
    section: "§1798.100(b)",
    severity: "critical",
    isBuiltIn: true,
    keywords: ["privacy notice", "notice at collection", "point of collection", "disclosure"],
    createdAt: ts,
  },
  {
    id: "ccpa-6",
    frameworkId: "ccpa",
    title: "Service Provider Contract Requirements",
    description:
      "Policy must require written contracts with service providers that process personal information, prohibiting them from retaining, using, or disclosing the data for unauthorized purposes.",
    section: "§1798.140(w)",
    severity: "high",
    isBuiltIn: true,
    keywords: ["service provider", "contract", "processing agreement", "vendor contract"],
    createdAt: ts,
  },
  {
    id: "ccpa-7",
    frameworkId: "ccpa",
    title: "Data Inventory & Mapping",
    description:
      "Policy must describe the process for maintaining a comprehensive inventory of personal information collected, including categories, sources, purposes, and recipients.",
    section: "§1798.110",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["data inventory", "data mapping", "data catalog", "personal information categories"],
    createdAt: ts,
  },
  {
    id: "ccpa-8",
    frameworkId: "ccpa",
    title: "Consumer Identity Verification",
    description:
      "Policy must describe reasonable procedures for verifying the identity of consumers making requests to know or delete personal information.",
    section: "§1798.140",
    severity: "high",
    isBuiltIn: true,
    keywords: ["identity verification", "consumer verification", "authentication", "request verification"],
    createdAt: ts,
  },
  {
    id: "ccpa-9",
    frameworkId: "ccpa",
    title: "Financial Incentive Disclosure",
    description:
      "Policy must disclose any financial incentive programs tied to the collection or sale of personal information, including the material terms and opt-in/opt-out mechanisms.",
    section: "§1798.125(b)",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["financial incentive", "loyalty program", "discount", "incentive disclosure"],
    createdAt: ts,
  },
  {
    id: "ccpa-10",
    frameworkId: "ccpa",
    title: "Authorized Agent Request Handling",
    description:
      "Policy must describe how the business handles requests submitted by authorized agents on behalf of consumers, including required verification steps.",
    section: "§1798.185(a)(7)",
    severity: "medium",
    isBuiltIn: true,
    keywords: ["authorized agent", "power of attorney", "agent request", "representative"],
    createdAt: ts,
  },
];

// ─── Helper: get framework color as Tailwind text class ────────────────────
export function getFrameworkTextColor(color: string): string {
  return color.replace("bg-", "text-");
}

// ─── Helper: get framework color as Tailwind border class ──────────────────
export function getFrameworkBorderColor(color: string): string {
  return color.replace("bg-", "border-");
}

// ─── Helper: get severity badge styles ─────────────────────────────────────
export function getSeverityStyles(severity: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case "critical":
      return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" };
    case "high":
      return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" };
    case "medium":
      return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    case "low":
      return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
    case "info":
      return { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
    default:
      return { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
  }
}
